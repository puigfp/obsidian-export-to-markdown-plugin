import { App, MarkdownView, TFile } from "obsidian";
import { parseMarkdown, stringifyMarkdownTree } from "./parse";
import {
	computeNewLocalPaths,
	convertLinksToPaths,
	extractLinksFromTree,
	updateTreeLinks,
} from "./transform";
import { ExportToMarkdownPlugingSettings } from "./settings";

export function canExportCurrentFile(app: App): boolean {
	const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
	return markdownView !== undefined;
}

export async function exportCurrentFileToMarkdown(
	app: App,
	settings: ExportToMarkdownPlugingSettings
): Promise<void> {
	const markdownView = app.workspace.getActiveViewOfType(MarkdownView)!;
	const markdownFile = markdownView.file!;

	const content = await app.vault.read(markdownFile);
	const tree = parseMarkdown(content);
	const links = extractLinksFromTree(tree);
	const linksToFiles = convertLinksToPaths(markdownFile, links, app);
	const attachmentFolderName = settings.attachmentFolderName;
	const filesToCopy = computeNewLocalPaths(
		linksToFiles,
		attachmentFolderName
	);
	const updatedTree = updateTreeLinks(tree, filesToCopy);
	const stringifiedTree = stringifyMarkdownTree(updatedTree);

	const outputFolder = `${settings.exportFolderName}/${markdownFile.basename}`;
	const outputPath = `${outputFolder}/${markdownFile.name}`;

	// Create output folder if it doesn't exist
	if (!app.vault.getAbstractFileByPath(outputFolder)) {
		await app.vault.createFolder(outputFolder);
	}

	// Create the exported markdown file
	await app.vault.create(outputPath, stringifiedTree);

	// Create attachments folder if it doesn't exist
	const attachmentsFolder = `${outputFolder}/${attachmentFolderName}`;
	if (!app.vault.getAbstractFileByPath(attachmentsFolder)) {
		await app.vault.createFolder(attachmentsFolder);
	}

	// Copy all attachment files
	for (const fileToCopy of filesToCopy.values()) {
		const file = app.vault.getFileByPath(fileToCopy.localPath);
		if (file) {
			await app.vault.copy(
				file,
				`${outputFolder}/${fileToCopy.exportedLocalPath}`
			);
		}
	}
}
