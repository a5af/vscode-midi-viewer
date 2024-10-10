import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'midiViewer.customEditor',
      new MidiViewerCustomEditorProvider(context)
    )
  );
}

class MidiViewerCustomEditorProvider
  implements vscode.CustomTextEditorProvider
{
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): void {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    const updateWebView = () => {
      const text = document.getText();
      webviewPanel.webview.postMessage({ type: 'update', text });
    };

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebView();
        }
      }
    );

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    updateWebView();
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MIDI Viewer</title>
        <style>
          canvas { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <canvas id="pianoRoll"></canvas>
        <script>
          const canvas = document.getElementById('pianoRoll');
          const ctx = canvas.getContext('2d');

          // Placeholder drawing
          ctx.fillStyle = 'black';
          ctx.fillRect(10, 10, 100, 50);

			window.addEventListener('message', event => {
			const message = event.data;
			if (message.type === 'update') {
				const midiData = new Uint8Array(message.text.split(','));
				const midiFile = new MIDIFile(midiData);

				const tracks = midiFile.getTrackEvents();
				console.log('MIDI tracks:', tracks);

				// TODO: Visualize the notes as a piano roll
			}
			});
        </script>
      </body>
      </html>`;
  }
}
