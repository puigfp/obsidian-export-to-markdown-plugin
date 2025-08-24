import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

export interface ExportToMarkdownPlugingSettings {
	attachmentFolderName: string;
	exportFolderName: string;
}

export const DEFAULT_SETTINGS: ExportToMarkdownPlugingSettings = {
	attachmentFolderName: "attachments",
	exportFolderName: "markdown-export-output",
};

export class ExportToMarkdownSettingTab extends PluginSettingTab {
	plugin: Plugin & { settings: ExportToMarkdownPlugingSettings };

	constructor(app: App, plugin: Plugin & { settings: ExportToMarkdownPlugingSettings }) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Export folder name")
			.setDesc(
				"The name of the folder where exported markdown files will be written to"
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
						await (this.plugin as any).saveSettings();
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
						await (this.plugin as any).saveSettings();
					})
			);
	}
}
