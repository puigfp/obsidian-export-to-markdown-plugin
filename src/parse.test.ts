import { parseMarkdown, stringifyMarkdownTree } from "./parse";


describe("parse", () => {
  it("should parse markdown with wikilinks and frontmatter", async () => {
    const markdown = `---
yaml: frontmatter
---
# Hello, world!

[regular link](https://example.com)

[[WikiLink Target|WikiLink Display Text]]

![[WikiLink Target]]
`;

    // Parse markdown to tree
    const tree = parseMarkdown(markdown);
    expect(tree).toMatchSnapshot();

    // Stringify tree to markdown
    const stringified = stringifyMarkdownTree(tree);
    expect(stringified).toMatchSnapshot();
  });
});
