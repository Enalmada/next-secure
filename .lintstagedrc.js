const tsc = () => "bun --bun tsc --noEmit";

export default {
	"**/*.{js,jsx,ts,tsx,json,yaml,yml,md,css,scss}": () => "bun run lint",
	"**/*.{ts,tsx}": [tsc],
	// './package.json': ['npm pkg fix', 'fixpack'],
};
