import { NextRequest, NextResponse } from 'next/server';
import { analyzeSnapchatUser } from '@/lib/snapchat';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const data = await analyzeSnapchatUser(username);
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to analyze user' },
      { status: 500 }
    );
  }
}
