import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
  try {
    const { cityId } = await params;

    const { data, error } = await supabase
      .from('climate')
      .select('month, avg_high_temp_c, avg_low_temp_c, avg_precip_mm')
      .eq('city_id', cityId)
      .order('month');

    if (error) {
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ months: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
