import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Resolve config.json relative to the Next.js project root
const CONFIG_PATH = path.join(process.cwd(), '..', 'config.json');

export async function GET() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(data);
    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error('[API Config] Error reading config:', error);
    return NextResponse.json(
      { error: 'Failed to read configuration file.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const newConfig = await request.json();

    // Basic Validation
    if (!newConfig.assistantName || !newConfig.wakeWord) {
      return NextResponse.json(
        { error: 'Assistant Name and Wake Word are required.' },
        { status: 400 }
      );
    }

    // Write back to config.json with formatting
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');

    return NextResponse.json(newConfig, { status: 200 });
  } catch (error) {
    console.error('[API Config] Error saving config:', error);
    return NextResponse.json(
      { error: 'Failed to write configuration file.' },
      { status: 500 }
    );
  }
}
