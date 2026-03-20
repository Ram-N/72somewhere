import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { LocationFilter } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, minTemp, maxTemp, locationFilter } = await request.json() as {
      startDate: string;
      endDate: string;
      minTemp: number;
      maxTemp: number;
      locationFilter?: LocationFilter;
    };

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
      months.add(current.getMonth() + 1);
      current.setMonth(current.getMonth() + 1);
    }

    const monthArray = Array.from(months);

    console.log('Searching for:', { months: monthArray, minTemp, maxTemp, locationFilter });

    // Build base query
    let query = supabase.from('climate').select('*').in('month', monthArray);

    if (locationFilter) {
      // With location filter: fetch ALL cities in the area (no temp filter in DB)
      query = query.eq(locationFilter.filterField, locationFilter.filterValue);
    } else {
      // Standard search: filter by temp in DB
      query = query.gte('avg_high_temp_c', minTemp).lte('avg_low_temp_c', maxTemp);
    }

    const { data: climateData, error } = await query;

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
    const cityMap = new Map<string, {
      city_id: string;
      city_name: string;
      country: string;
      highTemps: number[];
      lowTemps: number[];
      precip: number[];
    }>();

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
      const city = cityMap.get(cityId)!;
      city.highTemps.push(record.avg_high_temp_c);
      city.lowTemps.push(record.avg_low_temp_c);
      city.precip.push(record.avg_precip_mm);
    });

    const targetTemp = (minTemp + maxTemp) / 2;

    // Calculate averages and score cities
    const allDestinations = Array.from(cityMap.values()).map((city) => {
      const avgHigh = city.highTemps.reduce((a, b) => a + b, 0) / city.highTemps.length;
      const avgLow = city.lowTemps.reduce((a, b) => a + b, 0) / city.lowTemps.length;
      const avgTemp = (avgHigh + avgLow) / 2;
      const avgPrecip = city.precip.reduce((a, b) => a + b, 0) / city.precip.length;
      const tempDiff = Math.abs(avgTemp - targetTemp);
      const matchesTemp = avgHigh >= minTemp && avgLow <= maxTemp;

      return {
        city_id: city.city_id,
        city_name: city.city_name,
        country: city.country,
        avg_high: Math.round(avgHigh * 10) / 10,
        avg_low: Math.round(avgLow * 10) / 10,
        avg_temp: Math.round(avgTemp * 10) / 10,
        avg_precip: Math.round(avgPrecip * 10) / 10,
        score: tempDiff,
        matches_temp: matchesTemp,
      };
    });

    let destinations;
    if (locationFilter) {
      // Show all cities in area: matched first, then unmatched, each group sorted by score
      const matched = allDestinations.filter((d) => d.matches_temp).sort((a, b) => a.score - b.score);
      const unmatched = allDestinations.filter((d) => !d.matches_temp).sort((a, b) => a.score - b.score);
      // Cap at 30 to avoid overwhelming results for large regions
      destinations = [...matched, ...unmatched].slice(0, 30);
    } else {
      destinations = allDestinations.sort((a, b) => a.score - b.score).slice(0, 10);
    }

    return NextResponse.json({
      destinations,
      totalInArea: locationFilter ? allDestinations.length : undefined,
      matchedInArea: locationFilter ? allDestinations.filter((d) => d.matches_temp).length : undefined,
    });

  } catch (error: any) {
    console.error('Error processing search:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
