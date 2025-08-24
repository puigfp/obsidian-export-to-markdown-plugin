import {
	Notice,
	Plugin,
} from "obsidian";
import {
	canExportCurrentFile,
	exportCurrentFileToMarkdown
} from "./src/export";
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
				if (checking) {
					return canExportCurrentFile(this.app);
				}

				(async () => {
					try {
						await exportCurrentFileToMarkdown(this.app, this.settings);
						new Notice("File exported successfully");
					} catch (error) {
						new Notice("Failed to export file: ", error);
						console.error("Failed to export file:", error);
					}
				})();
			},
		});

		this.addSettingTab(new ExportToMarkdownSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = {
			...DEFAULT_SETTINGS,
			...(await this.loadData())
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


