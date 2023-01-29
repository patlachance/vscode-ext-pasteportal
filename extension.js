const vscode = require('vscode');
const axios = require('axios');

axios.defaults.headers.common['x-api-key'] = 'qVP1XsKWJF2vud7zo1jzS6BQ22xy4xXH4DY634py';

const api_endpoint = 'https://api.pasteportal.info';


function activate(context) {

	console.log('Congratulations, your extension "pasteportal" is now active!');

	let get_paste = vscode.commands.registerCommand('pasteportal-ext.get-paste', async function () {
		const pasteId = await vscode.window.showInputBox({
			prompt: "Enter the paste ID"
		});

		if (!pasteId) {
			return vscode.window.showErrorMessage("You must provide a paste ID. eg. 43e4c2");
		}
		const baseURL = `${api_endpoint}/get-paste?id=${pasteId}`;
		axios.get(baseURL)
			.then(async function (response) {
				const {
					response: {
						joke,
						id,
						paste,
						creator_gh_user,
						recipient_gh_username
					}
				} = response.data;
				console.log(joke, id, paste, creator_gh_user, recipient_gh_username)
				// get the active text editor
				const editor = vscode.window.activeTextEditor;
				// check if there is an active text editor
				if (!editor) {
					return vscode.window.showErrorMessage('No active text editor.');
				}
				// insert the paste content into the active editor
				editor.edit(editBuilder => {
					editBuilder.insert(editor.selection.active, paste);
				});
				vscode.window.showInformationMessage(`Paste retrieved successfully.`);
			})
			.catch(function (error) {
				console.log(error);
			});
	});


	let store_paste = vscode.commands.registerCommand('pasteportal-ext.store-paste', async function () {
		try {
			// get the active text editor
			const editor = vscode.window.activeTextEditor;
			// Get the selected text
			const selectedText = editor.document.getText(editor.selection);


			// post the selected text to the API
			const baseURL = `${api_endpoint}/store-paste`;
			let {
				data
			} = await axios.post(baseURL, {
				paste: selectedText,
				recipient_gh_username: 'stiliajohny', // TODO get the username from the user
				creator_gh_user: 'stiliajohny' // TODO get the username from the user
			});
			const {
				joke,
				id,
				paste,
				creator_gh_user,
				recipient_gh_username
			} = data.response;
			console.log(joke, id, paste, creator_gh_user, recipient_gh_username);
			vscode.window.showInformationMessage(`Hooray. Paste-ID: ${id}`);
			// store the ID in the clipboard
			vscode.env.clipboard.writeText(id);
		} catch (error) {
			console.log(error);
			vscode.window.showErrorMessage(`Things gone haywire: ${error.message}`);

		}
	});

	context.subscriptions.push(get_paste);
	context.subscriptions.push(store_paste);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}