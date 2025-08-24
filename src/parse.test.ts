import { parseMarkdown, stringifyMarkdownTree } from "./parse";


describe("parse", () => {
  it("should parse markdown", async () => {
    const markdown = "# Hello, world! [[WikiLink Target|WikiLink Display Text]]";
    const tree = parseMarkdown(markdown);
    const stringified = stringifyMarkdownTree(tree);
    console.log(JSON.stringify(tree, null, 2));
    console.log(stringified);
    expect(tree).toMatchSnapshot();
  });
});
