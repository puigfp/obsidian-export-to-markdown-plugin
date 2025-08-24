import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import remarkWikiLink from "@portaljs/remark-wiki-link";
import remarkFrontmatter from "remark-frontmatter";
import { Root } from "remark-parse/lib";

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkWikiLink, {
		aliasDivider: "|", // by default, this extension uses [[Link:Display]] instead of [[Link|Display]] like Obsidian does
	})
	.use(remarkFrontmatter, ["yaml"]) // we don't do anything with the YAML frontmatter, but prevents parts of it from being parsed as Markdown titles because of the "---" delimiters
	.use(remarkStringify);

export function parseMarkdown(markdown: string): Root {
	const tree = processor.parse(markdown);
	return tree;
}

export function stringifyMarkdownTree(tree: Root): string {
	return processor.stringify(tree);
}
