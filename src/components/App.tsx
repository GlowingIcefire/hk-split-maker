import type { FormEvent, ReactNode } from "react";
import React, { Component } from "react";
import { saveAs } from "file-saver";
import type { Config } from "../lib/lss";
import { createSplitsXml } from "../lib/lss";

const TEXTAREA_ROWS = 22;
const TEXTAREA_COLS = 80;

const sampleConfig = {
    "splitIds": [
        "KingsPass",
        "VengefulSpirit",
        "Greenpath",
        "MothwingCloak",
        "Aluba"
    ],
    "ordered": true,
    "endTriggeringAutosplit": true,
    "gameName": "Hollow Knight Category Extensions",
    "categoryName": "Aluba%",
    "variables": {
        "platform": "PC",
        "patch": "1.4.3.2",
        "glitch": "Current Patch NMG",
    },
};

type AppProps = Record<string, never>;
interface AppState {
    configInput: string;
    splitOutput: string;
}
export default class App extends Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {
            configInput: JSON.stringify(sampleConfig, null, 4),
            splitOutput: "",
        };
    }
    public render(): ReactNode {
        return (
            <div className="App">
                <h1>Hollow Knight Split Maker</h1>
                <form onSubmit={this.onSubmit.bind(this)}>
                    <h2>Input config JSON</h2>
                    <textarea
                        id="split-config-input"
                        rows={TEXTAREA_ROWS}
                        cols={TEXTAREA_COLS}
                        defaultValue={this.state.configInput}
                        onChange={this.onConfigInputChange.bind(this)}
                    ></textarea>
                    <br></br>
                    <input id="submit-button" type="submit" value="Submit"/>
                </form>
                <h2>Output Splits File</h2>
                <div className="output-container">
                    <button
                        id="download-button"
                        onClick={this.onDownload.bind(this)}
                    >💾 Download</button>
                    <textarea
                        id="split-result"
                        rows={TEXTAREA_ROWS}
                        cols={TEXTAREA_COLS}
                        defaultValue={this.state.splitOutput}
                    ></textarea>
                </div>
            </div>
        );
    }

    private onConfigInputChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        this.setState({
            configInput: event.target.value,
        });
    }

    private parseConfigInput() {
        return JSON.parse(this.state.configInput) as Config;
    }

    private async onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        let configObject;
        try {
            configObject = this.parseConfigInput();
        }
        catch {
            alert("Failed to parse config as JSON");
            return;
        }
        console.log(configObject);
        let output = "";

        const submitButton = document.getElementById("submit-button") as HTMLInputElement;
        submitButton.disabled = true;
        try {
            // todo: runtime schema validation
            output = await createSplitsXml(configObject);
        }
        catch (e) {
            console.error(e);
            alert("Failed to create splits. The error has been logged to console.error");
            return;
        }
        finally {
            submitButton.disabled = false;
        }

        this.setState({
            splitOutput: output,
        });
    }

    private onDownload(): void {
        const output = this.state.splitOutput;
        const outBlob = new Blob([output]);

        // Guess a good file name.
        // Can be inaccurate if a new config has been entered but not processed yet.
        let splitName = "";
        let configObject;
        try {
            configObject = this.parseConfigInput();
            splitName = configObject?.categoryName || "splits";
            // Make file name compatible:
            splitName = splitName
                .toLowerCase()
                .replace(/[^a-z0-9]/gi, "_")  // replace non-alphanum with _
                .replace(/^_+|_+$/g, "")  // remove outer _
                .replace(/^_+|_+$/g, "")  // remove outer _
                .replace(/_{2,}/g, "_");  // join multiple _
        }
        catch {
            splitName = "splits";
        }
        saveAs(outBlob, `${splitName}.lss`);
    }
}
