import { json } from '@sveltejs/kit';
import { kv } from '@vercel/kv';

const KEY = 'mindre:data';

export async function GET() {
	try {
		const data = await kv.get(KEY);
		return json(data || { decks: [] });
	} catch (e) {
		console.error('KV GET error:', e);
		return json({ decks: [] });
	}
}

export async function POST({ request }) {
	try {
		const body = await request.json();
		await kv.set(KEY, body);
		return json({ ok: true });
	} catch (e) {
		console.error('KV POST error:', e);
		return json({ ok: false }, { status: 500 });
	}
}
