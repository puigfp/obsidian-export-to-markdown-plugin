import {
	App,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { parseMarkdown, stringifyMarkdownTree } from "./src/parse";
import {
	computeNewLocalPaths,
	convertLinksToPaths,
	extractLinksFromTree,
	updateTreeLinks,
} from "src/transform";

// Remember to rename these classes and interfaces!

interface ExportToMarkdownPlugingSettings {
	attachmentFolderName: string;
	exportFolderName: string;
}

const DEFAULT_SETTINGS: ExportToMarkdownPlugingSettings = {
	attachmentFolderName: "attachments",
	exportFolderName: "markdown-export-output",
};

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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ExportToMarkdownSettingTab extends PluginSettingTab {
	plugin: ExportToMarkdownPlugin;

	constructor(app: App, plugin: ExportToMarkdownPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Export folder name")
			.setDesc(
				"The name of the folder where exported markdown files will be stored"
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.exportFolderName)
					.onChange(async (value) => {
						if (value.length === 0) {
							new Notice(
								"Export folder name cannot be empty"
							);
							return;
						}
						this.plugin.settings.exportFolderName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Attachment folder name")
			.setDesc(
				"The name of the folder where attachments will be stored alongside the exported markdown file"
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.attachmentFolderName)
					.onChange(async (value) => {
						if (value.length === 0) {
							new Notice(
								"Attachment folder name cannot be empty"
							);
							return;
						}
						this.plugin.settings.attachmentFolderName = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
