import {
	MarkdownView,
	Plugin,
} from "obsidian";
import { parseMarkdown, stringifyMarkdownTree } from "./src/parse";
import {
	computeNewLocalPaths,
	convertLinksToPaths,
	extractLinksFromTree,
	updateTreeLinks,
} from "src/transform";
import {
	ExportToMarkdownPlugingSettings,
	DEFAULT_SETTINGS,
	ExportToMarkdownSettingTab
} from "./src/settings";

export default class ExportToMarkdownPlugin extends Plugin {
	settings: ExportToMarkdownPlugingSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "export-current-file-to-markdown",
			name: "Export current file",
			checkCallback: (checking: boolean) => {
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (checking) {
					return markdownView !== undefined;
				}
				const markdownFile = markdownView?.file!;

				(async () => {
					const content = await this.app.vault.read(markdownFile);
					const tree = parseMarkdown(content);
					const links = extractLinksFromTree(tree);
					const linksToFiles = convertLinksToPaths(
						markdownFile,
						links,
						this.app
					);
					const attachmentFolderName =
						this.settings.attachmentFolderName;
					const filesToCopy = computeNewLocalPaths(
						linksToFiles,
						attachmentFolderName
					);
					const updatedTree = updateTreeLinks(tree, filesToCopy);
					const stringifiedTree = stringifyMarkdownTree(updatedTree);
					const outputFolder = `${this.settings.exportFolderName}/${markdownFile.basename}`;
					const outputPath = `${outputFolder}/${markdownFile.name}`;
					if (!this.app.vault.getAbstractFileByPath(outputFolder)) {
						await this.app.vault.createFolder(outputFolder);
					}
					await this.app.vault.create(outputPath, stringifiedTree);
					const attachmentsFolder = `${outputFolder}/${attachmentFolderName}`;
					if (
						!this.app.vault.getAbstractFileByPath(attachmentsFolder)
					) {
						await this.app.vault.createFolder(attachmentsFolder);
					}
					for (const fileToCopy of filesToCopy.values()) {
						const file = this.app.vault.getFileByPath(
							fileToCopy.localPath
						)!;
						await this.app.vault.copy(
							file,
							`${outputFolder}/${fileToCopy.exportedLocalPath}`
						);
					}
				})();
			},
		});

		this.addSettingTab(new ExportToMarkdownSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


