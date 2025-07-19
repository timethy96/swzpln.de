// Simple reroute function without paraglide dependency for now
export const reroute = (request) => {
	// Just return the pathname as-is for now
	return new URL(request.url).pathname;
};
