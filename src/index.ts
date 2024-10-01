/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

interface CfImageOptions {
	width?: number;
	format?: 'avif' | 'webp';
	blur?: number;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// const url = new URL(request.url);

		// const query = url.searchParams.get('ab');

		// return new Response('Hello World! ' + url.pathname + query);

		let url = new URL(request.url);

		let options: { cf: { image: CfImageOptions } } = { cf: { image: {} } };

		const widthParam = url.searchParams.get('width');
		if (widthParam) {
			const width = parseInt(widthParam, 10);
			if (!isNaN(width)) {
				options.cf.image.width = width;
			}
		}

		const blurParam = url.searchParams.get('blur');
		if (blurParam) {
			const blur = parseInt(blurParam, 10);
			if (!isNaN(blur) && blur >= 1 && blur <= 250) {
				options.cf.image.blur = blur;
			}
		}

		const accept = request.headers.get('Accept') ?? '';
		if (/image\/avif/.test(accept)) {
			options.cf.image.format = 'avif';
		} else if (/image\/webp/.test(accept)) {
			options.cf.image.format = 'webp';
		}

		const imageURL = url.searchParams.get('image');
		if (!imageURL) return new Response('Missing "image" value', { status: 400 });

		try {
			const { hostname, pathname } = new URL(imageURL);

			if (!/\.(jpe?g|png|gif|webp)$/i.test(pathname)) {
				return new Response('Disallowed file extension', { status: 400 });
			}

			if (hostname !== 'makers-web-img.s3.ap-northeast-2.amazonaws.com') {
				return new Response('Must use "example.com" source images', { status: 403 });
			}
		} catch (err) {
			return new Response('Invalid "image" value', { status: 400 });
		}

		const imageRequest = new Request(imageURL, {
			headers: request.headers,
		});

		console.log(options);

		return fetch(imageRequest, options);
	},
} satisfies ExportedHandler<Env>;
