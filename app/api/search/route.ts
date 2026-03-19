import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, minTemp, maxTemp } = await request.json();

    // Validate inputs
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Convert dates to months
    const start = new Date(startDate);
    const end = new Date(endDate);

    const months = new Set<number>();
    const current = new Date(start);

    while (current <= end) {
      months.add(current.getMonth() + 1); // JavaScript months are 0-indexed
      current.setMonth(current.getMonth() + 1);
    }

    const monthArray = Array.from(months);

    console.log('Searching for:', { months: monthArray, minTemp, maxTemp });

    // Query climate data for matching months and temperature
    const { data: climateData, error } = await supabase
      .from('climate')
      .select('*')
      .in('month', monthArray)
      .gte('avg_high_temp_c', minTemp)
      .lte('avg_low_temp_c', maxTemp);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    if (!climateData || climateData.length === 0) {
      return NextResponse.json({ destinations: [] });
    }

    // Group by city and calculate averages
    const cityMap = new Map();

    climateData.forEach((record: any) => {
      const cityId = record.city_id;

      if (!cityMap.has(cityId)) {
        cityMap.set(cityId, {
          city_id: cityId,
          city_name: record.city_name,
          country: record.country,
          highTemps: [],
          lowTemps: [],
          precip: [],
        });
      }

      const city = cityMap.get(cityId);
      city.highTemps.push(record.avg_high_temp_c);
      city.lowTemps.push(record.avg_low_temp_c);
      city.precip.push(record.avg_precip_mm);
    });

    // Calculate averages and score cities
    const destinations = Array.from(cityMap.values())
      .map((city: any) => {
        const avgHigh = city.highTemps.reduce((a: number, b: number) => a + b, 0) / city.highTemps.length;
        const avgLow = city.lowTemps.reduce((a: number, b: number) => a + b, 0) / city.lowTemps.length;
        const avgTemp = (avgHigh + avgLow) / 2;
        const avgPrecip = city.precip.reduce((a: number, b: number) => a + b, 0) / city.precip.length;

        // Score based on how close to target temperature
        const targetTemp = (minTemp + maxTemp) / 2;
        const tempDiff = Math.abs(avgTemp - targetTemp);

        return {
          city_id: city.city_id,
          city_name: city.city_name,
          country: city.country,
          avg_high: Math.round(avgHigh * 10) / 10,
          avg_low: Math.round(avgLow * 10) / 10,
          avg_temp: Math.round(avgTemp * 10) / 10,
          avg_precip: Math.round(avgPrecip * 10) / 10,
          score: tempDiff, // Lower is better
        };
      })
      .sort((a, b) => a.score - b.score) // Sort by best match
      .slice(0, 10); // Return top 10

    return NextResponse.json({ destinations });

  } catch (error: any) {
    console.error('Error processing search:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
