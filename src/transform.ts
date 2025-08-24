import { App, TFile } from "obsidian";
import { Root } from "remark-parse/lib";
import { visit } from "unist-util-visit";
import { map } from "unist-util-map";

// Link node types
const LINK_NODES = ["link", "wikiLink"];

// Helper function to extract link from a node
function extractUrlFromNode(node: any): string {
	// standard mdast Link
	if (node.type === "link") {
		return node.url;
	}
	// wikilink node from @portaljs/remark-wiki-link
	if (node.type === "wikiLink") {
		return node.data.target;
	}
	throw new Error(`Unknown link type: ${node.type}`);
}

// Traverse the tree and returns all the other other files referenced through links.
export function extractLinksFromTree(tree: Root): Set<string> {
	const links = new Set<string>();
	visit(tree, LINK_NODES, (node: any) => {
		const link = extractUrlFromNode(node);
		links.add(link);
	});
	return links;
}

// Resolve Obsidian links to TFile objects
export function convertLinksToPaths(
	markDownFile: TFile,
	links: Set<string>,
	vault: App
): Map<string, TFile> {
	const linksToFiles = new Map<string, TFile>();
	for (const link of links) {
		const file = vault.metadataCache.getFirstLinkpathDest(
			link,
			markDownFile.path
		);
		if (file == null) {
			continue;
		}
		linksToFiles.set(link, file);
	}
	return linksToFiles;
}

interface FileToCopy {
	url: string;
	localPath: string;
	exportedLocalPath: string;
}

// Compute new local paths
export function computeNewLocalPaths(
	linksToFiles: Map<string, TFile>,
	attachmentFolder: string | null
): Map<string, FileToCopy> {
	const filesToCopy = new Map<string, FileToCopy>();
	for (const [link, file] of linksToFiles) {
		filesToCopy.set(link, {
			url: link,
			localPath: file.path,
			exportedLocalPath: `${attachmentFolder}/${file.name}`, // TODO: handle filename collisions
		});
	}
	return filesToCopy;
}

export function updateTreeLinks(
	tree: Root,
	filesToCopy: Map<string, FileToCopy>
): Root {
	return map(tree, (node: any) => {
		// Skip non-link nodes
		if (!LINK_NODES.includes(node.type as string)) {
			return node;
		}

		// Extract link from node
		const link = extractUrlFromNode(node);

		const fileToCopy = filesToCopy.get(link);
		const newUrl = fileToCopy?.exportedLocalPath ?? link;

		// For regular links, we just need to update the URL with the new one
		if (node.type === "link") {
			return { ...node, url: newUrl };
		}

		// For WikiLinks, we need to convert the WikiLink node to a regular link (or image) node
		if (node.type === "wikiLink") {
			// If the existing WikiLink has no alias, use the URL itself as an alias
			const newAlias = node.data.alias ?? newUrl;

			if (node.data.isEmbed) { // isEmbed is true for ![[*]] links, false for [[*]] links
				return {
					type: "image",
					url: newUrl,
					alt: newAlias,
				};
			}
			return {
				type: "link",
				url: newUrl,
				children: [{ type: "text", value: newAlias }],
			};
		}

		throw new Error(`Unreachable code`);
	});
}
