const vscode = require('vscode');
const axios = require('axios');


axios.defaults.headers.common['x-api-key'] = 'qVP1XsKWJF2vud7zo1jzS6BQ22xy4xXH4DY634py';

const api_endpoint = 'https://api.pasteportal.info';

const tos_link = "[Terms of Service](https://github.com/stiliajohny/vscode-ext-pasteportal/blob/master/TOS.md)";


function activate(context) {

  console.log('Congratulations, your extension "pasteportal" is now active!');


  async function checkServiceAgreement() {
    let serviceAgreementAccepted = vscode.workspace.getConfiguration().get('pasteportal.serviceAgreementAccepted');
    if (serviceAgreementAccepted === true) {
      console.log('Service agreement accepted already');
      return true;
    } else if (serviceAgreementAccepted === false) {
      console.log('Service agreement was not accepted. Asking user to accept the terms of service');

      let acceptTerms = await vscode.window.showInformationMessage(`Please accept the ${tos_link} before using the extension.`, "Agree", "Disagree");
      if (acceptTerms === 'Agree') {
        vscode.workspace.getConfiguration().update('pasteportal.serviceAgreementAccepted', true, vscode.ConfigurationTarget.Global);
        console.log('Service agreement accepted');
        return true;
      } else if (acceptTerms === 'Disagree') {
        vscode.workspace.getConfiguration().update('pasteportal.serviceAgreementAccepted', false, vscode.ConfigurationTarget.Global);
        vscode.window.showErrorMessage('You must accept the terms of service to use this extension.');
        console.log('Service agreement not accepted');
        return false;
      }

    }
  }


  let get_paste = vscode.commands.registerCommand('pasteportal.get-paste', async function () {
    // check if user has accepted the service agreement or not
    if (!(await checkServiceAgreement())) {
      return;
    }

    console.log('Command: pasteportal.get-paste - started');
    // get the active text editor
    const editor = vscode.window.activeTextEditor;
    // check if there is an active text editor
    if (!editor) throw new Error('No active text editor.');
    console.log('Active text editor found');

    const pasteId = await vscode.window.showInputBox({
      prompt: "Enter the paste ID. eg. 43e4c2"
    });
    if (!pasteId) {
      console.log('No paste ID provided');
      return vscode.window.showErrorMessage("You must provide a paste ID. eg. 43e4c2");
    }
    console.log('Paste ID: ', pasteId);

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
        console.log("Joke: :" + joke)
        console.log("ID: :" + id)
        console.log("Paste: :" + paste)
        console.log("Creator: :" + creator_gh_user)
        console.log("Recipient: :" + recipient_gh_username)


        // insert the paste content into the active editor
        editor.edit(editBuilder => {
          editBuilder.insert(editor.selection.active, paste);
        });
        console.log('Paste retrieved successfully');
        vscode.window.showInformationMessage(`Paste retrieved successfully.`);
      })
      .catch(function (error) {
        console.log(error);
        vscode.window.showErrorMessage(`Things gone haywire:\n ${error.message}`);
      });
  });


  let store_paste = vscode.commands.registerCommand('pasteportal.store-paste', async function () {
    try {
      // check if user has accepted the service agreement or not
      if (!(await checkServiceAgreement())) {
        return;
      }
      console.log('Command: pasteportal.store-paste - started');
      // get the active text editor
      const editor = vscode.window.activeTextEditor;
      //  check if there is an active text editor and if there isnt thwor an error using the catch
      if (!editor) throw new Error('No active text editor.');
      console.log('Active text editor found');
      // Get the selected text
      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText) throw new Error('No text selected.');
      console.log('Selected text found');

      // check if the selected text is more than 400kb
      if (selectedText.length > 400000) throw new Error('The selected text is more than 400kb. Please select a smaller text.');
      console.log('Selected text is less than 400kb. Text length: ', selectedText.length, 'bytes');
      // post the selected text to the API
      const baseURL = `${api_endpoint}/store-paste`;
      let {
        data
      } = await axios.post(baseURL, {
        paste: selectedText,
        recipient_gh_username: 'unknown', // TODO get the username from the user
        creator_gh_user: 'unknown' // TODO get the username from the user
      });

      console.log('Paste stored to the API');
      const {
        joke,
        id,
        paste,
        creator_gh_user,
        recipient_gh_username
      } = data.response;
      console.log("Joke: :" + joke)
      console.log("ID: :" + id)
      console.log("Paste: :" + paste)
      console.log("Creator: :" + creator_gh_user)
      console.log("Recipient: :" + recipient_gh_username)
      vscode.window.showInformationMessage(`Hooray. Paste-ID: ${id}`);
      // store the ID in the clipboard
      vscode.env.clipboard.writeText(id);
      console.log('Paste-ID copied to the clipboard');

    } catch (error) {
      console.log(error);
      vscode.window.showErrorMessage(`Things gone haywire:\n ${error.message}`);
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