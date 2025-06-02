export default function importifyPath(path: string) {
	return path.replace(/\\\\/g, '/').replace(/\\/g, '/');;
}
