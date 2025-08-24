import { assert } from "console";
import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { parseMarkdown, stringifyMarkdownTree } from "./src/parse";
import * as mdast from "mdast";
import { computeNewLocalPaths, convertLinksToPaths, extractLinksFromTree, updateTreeLinks } from "src/transform";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// // This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "export-to-markdown",
			name: "Export current file",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (checking) {
					return markdownView !== undefined;
				}
				assert(markdownView !== undefined);
				const markdownFile = markdownView?.file;
				if (markdownFile == undefined || markdownFile == null) {
					return;
				}
				// read file
				(async () => {
					const content = await this.app.vault.read(markdownFile);
					const tree = parseMarkdown(content);
					const links = extractLinksFromTree(tree);
					const linksToFiles = convertLinksToPaths(markdownFile, links, this.app);
					const attachmentFolderName = "attachments";
					const filesToCopy = computeNewLocalPaths(linksToFiles, attachmentFolderName);
					const updatedTree = updateTreeLinks(tree, filesToCopy);
					const stringifiedTree = stringifyMarkdownTree(updatedTree);
					const outputFolder = `markdown-export-output/${markdownFile.basename}`;
					const outputPath = `${outputFolder}/${markdownFile.name}`;
					if (!this.app.vault.getAbstractFileByPath(outputFolder)) {
						await this.app.vault.createFolder(outputFolder);
					}
					await this.app.vault.create(outputPath, stringifiedTree);
					const attachmentsFolder = `${outputFolder}/${attachmentFolderName}`;
					if (!this.app.vault.getAbstractFileByPath(attachmentsFolder)) {
						await this.app.vault.createFolder(attachmentsFolder);
					}
					for (const fileToCopy of filesToCopy.values()) {
						const file = this.app.vault.getFileByPath(fileToCopy.localPath)!;
						await this.app.vault.copy(file, `${outputFolder}/${fileToCopy.exportedLocalPath}`);
					}
				})();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, "click", (evt: MouseEvent) => {
		// 	console.log("click", evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
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

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
