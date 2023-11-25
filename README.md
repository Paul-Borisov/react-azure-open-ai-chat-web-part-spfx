# Azure OpenAI Chat Webpart

This is an Azure OpenAI Chat Web Part for SharePoint Online. It offers a user experience that is familiar to users of ChatGPT.

The web part supports both Azure OpenAI and native OpenAI endpoints, secured with Azure API Management (APIM).

- APIM authenticates users and injects the **api-key** into requests before forwarding them to the endpoints. The **api-key** does not travel in the browser.
- Using native OpenAI endpoints may grant you access to the latest models like gpt-4-vision-preview and gpt-4-1106-preview, which are not yet available in Azure OpenAI (as of Nov 2023).
- You can also use direct access to endpoints configured with an api-key.
  - **This is a less secure setup** and is not recommended for Production. However, it can be used for evaluations.
  - The stored key is encrypted in the web part properties. Nonetheless, it will travel in the browser and can be viewed within DEV tools > Network > Request headers.

![Data access diagram](https://github.com/Paul-Borisov/Azure-OpenAI-Chat-Webpart/blob/main/docs/principal-architecture.png "Data access diagram")

# Quick links

  - [Quick Start in Visual Studio Code (DEV)](#quick-start-in-visual-studio-code-(dev))

  - [Quick Start](#quick-start)

  - [More Advanced Setup](#more-advanced-setup)

  - [Full-Scale Setup for Large Environments](#full-scale-setup-for-large-environments)

# Quick Start in Visual Studio Code (DEV)

**Prerequisites**:

- Visual Studio Code with a development setup for building SPFx 1.16.1 - 1.18.0 components.
- You should have an **api-key** for native OpenAI or Azure OpenAI, with configured endpoints for text models of GPT 3.5 and, optionally, GPT 4.

## Configurations

1. Clone the project.

2. Open the project in Visual Studio Code and navigate to View > Terminal

3. Execute the following commands
   - cd ./spfx-latest
   - npm i
   - gulp build
   - gulp serve --nobrowser
     Alternatively, you can use fast-serve
   - npm run serve

4. Create a Site Page in SharePoint Online and open it in "debug mode" using the following format:
   - https://**yourtenant**.sharepoint.com/sites/tests/SitePages/**yourpage**.aspx?debug=true&noredir=true&debugManifestsFile=https%3A%2F%2Flocalhost%3A4321%2Ftemp%2Fmanifests.js

5. Edit the page and add the Azure OpenAI Chat web part.

6. Open the web part settings and configure the minimal set of required properties as follows:
   
   - **Client ID: create a user_impersonation app with name=openaiwp**: keep the default value or leave it empty.

   - **Base URL for GPT endpoint (APIM API or full)**: you can use the following alternatives:

     - Direct URL for the native OpenAI endpoint.

       - For example, https://api.openai.com/v1/chat/completions
       - You need to have an active paid OpenAI subscription and a valid **api-key** for it.

     - Direct URL for the Azure OpenAI endpoint configured for GPT 3.5 deployment.
       - For example, https://**instance**.openai.azure.com/openai/deployments/**gpt-35-turbo-16k**/chat/completions?api-version=2023-07-01-preview
       - You need to have an **api-key** for that instance.

   - **Base URL for GPT4 endpoint (APIM API or full)**: you can use the following alternatives:

     - Empty value if GPT-4 will not be used.

     - Direct URL for the native OpenAI endpoint, as mentioned above.

       - For example, https://api.openai.com/v1/chat/completions

     - Direct URL for the Azure OpenAI endpoint configured for GPT 4 deployment, as mentioned above.
       - For example, https://**instance**.openai.azure.com/openai/deployments/**gpt-4-32k**/chat/completions?api-version=2023-07-01-preview

   - **Base URL for Chat WebApi (APIM API or full)**: keep the default empty value.

   - **Optional api-key for Azure OpenAI (for troubleshooting, not for Production)**: add your api-key

     - The key for native OpenAI or for Azure OpenAI, depending on your choices above.

     - It will be encrypted and stored locally in the web part settings (and displayed as \*\*\* in the Property Pane).

   - **Language models**: adjust values in the text box if you have different ones.

   - **Storage type for chat history**: keep the default SharePoint list or select Local storage for a quick review.

   - **SharePoint list URL (leave it empty for default URL)**: leave it empty and click the Create button if you opt to use SharePoint list storage.

     - This will create a custom list, dbChats, in the current site collection.

       - By default, the chat sharing option is disabled.
       - If you enable it using the corresponding checkbox below the field, click on the Update button to adjust the list's permissions.

       - Note, if you use Local storage you will be able to review sharing features. However, real sharing between users will not work with Local storage because chat history is stored locally. The maximum capacity of Local storage is limited to 10 Mb.

7. Save web part settings. Reload the page.

8. Test the setup by entering any text into the prompt text area and clicking Enter.
   - The AI-response should appear in the content area.
   - Try the same with another language model (GPT-4).
   - Click on the upside arrow in the right-hand corner. Select any PDF file - for example, from ./docs folder - click OK to upload it. Click on the Submit button to summarize the uploaded PDF.

# Quick Start
  - [back to the top](#quick-links)

**Prerequisites**:

- You should be a site collection administrator or hold the role of SharePoint Administrator to create a new site.
- You should have an **api-key** for native OpenAI or Azure OpenAI, with configured endpoints for text models of GPT 3.5 and, optionally, GPT 4.

## Configurations

1. Download the latest [release package](https://github.com/Paul-Borisov/Azure-OpenAI-Chat-Webpart/releases/download/v1/azure-openai-chat.sppkg) or compile it from the source code in **spfx-latest**.

2. Create a site collection in SharePoint Online and an App Catalog for it.

   - PnP.PowerShell: [Add-PnPSiteCollectionAppCatalog](https://learn.microsoft.com/en-us/powershell/module/sharepoint-online/add-spositecollectionappcatalog?view=sharepoint-ps)
   - Alternatively, to simplify the process, just deploy the package into the global App Catalog of your tenant.

3. Upload the package into the App Catalog.

   - Add the app **Azure OpenAI Chat Web Part** to the site. Please ignore the warning about the required access permissions.

4. Add a new Site Page and the web part **Azure OpenAI Chat Web Part** to it.

5. Open the web part settings and configure the minimal set of required properties as follows:

   - **Client ID: create a user_impersonation app with name=openaiwp**: keep the default value or leave it empty.

   - **Base URL for GPT endpoint (APIM API or full)**: you can use the following alternatives:

     - Direct URL for the native OpenAI endpoint.

       - For example, https://api.openai.com/v1/chat/completions
       - You need to have an active paid OpenAI subscription and a valid **api-key** for it.

     - Direct URL for the Azure OpenAI endpoint configured for GPT 3.5 deployment.
       - For example, https://**instance**.openai.azure.com/openai/deployments/**gpt-35-turbo-16k**/chat/completions?api-version=2023-07-01-preview
       - You need to have an **api-key** for that instance.

   - **Base URL for GPT4 endpoint (APIM API or full)**: you can use the following alternatives:

     - Empty value if GPT-4 will not be used.

     - Direct URL for the native OpenAI endpoint, as mentioned above.

       - For example, https://api.openai.com/v1/chat/completions

     - Direct URL for the Azure OpenAI endpoint configured for GPT 4 deployment, as mentioned above.
       - For example, https://**instance**.openai.azure.com/openai/deployments/**gpt-4-32k**/chat/completions?api-version=2023-07-01-preview

   - **Base URL for Chat WebApi (APIM API or full)**: keep the default empty value.

   - **Optional api-key for Azure OpenAI (for troubleshooting, not for Production)**: add your api-key

     - The key for native OpenAI or for Azure OpenAI, depending on your choices above.

     - It will be encrypted and stored locally in the web part settings (and displayed as \*\*\* in the Property Pane).

   - **Language models**: adjust values in the text box if you have different ones.

   - **Storage type for chat history**: keep the default SharePoint list or select Local storage for a quick review.

   - **SharePoint list URL (leave it empty for default URL)**: leave it empty and click the Create button if you opt to use SharePoint list storage.

     - This will create a custom list, dbChats, in the current site collection.

       - By default, the chat sharing option is disabled.
       - If you enable it using the corresponding checkbox below the field, click on the Update button to adjust the list's permissions.

       - Note, if you use Local storage you will be able to review sharing features. However, real sharing between users will not work with Local storage because chat history is stored locally. The maximum capacity of Local storage is limited to 10 Mb.

6. Save web part settings. Reload the page.

7. Test the setup by entering any text into the prompt text area and clicking Enter.
   - The AI-response should appear in the content area.
   - Try the same with another language model (GPT-4).
   - Click on the upside arrow in the right-hand corner. Select any PDF file - for example, from ./docs folder - click OK to upload it. Click on the Submit button to summarize the uploaded PDF.

# More Advanced Setup
  - [back to the top](#quick-links)
  
**Prerequisites**:

- You should be in the role of Entra Application Administrator (Application Developer) or Global Administrator to create App registrations and approve permissions.
- You should be a site collection administrator or hold the role of SharePoint Administrator to create a new site.
- Optionally, you should have an **api-key** for native OpenAI or Azure OpenAI, with configured endpoints for text models of GPT 3.5 and, optionally, GPT 4.
  - Unless you use preconfigured APIM endpoints.

## Configurations

1. Download the latest [release package](https://github.com/Paul-Borisov/Azure-OpenAI-Chat-Webpart/releases/download/v1/azure-openai-chat.sppkg) or compile it from the source code in **spfx-latest**.

2. Create a site collection in SharePoint Online and an App Catalog for it.

   - PnP.PowerShell: [Add-PnPSiteCollectionAppCatalog](https://learn.microsoft.com/en-us/powershell/module/sharepoint-online/add-spositecollectionappcatalog?view=sharepoint-ps)

3. Upload the package into the App Catalog.

   - Add the app **Azure OpenAI Chat Web Part** to the site. Please note the warning about the required access permissions.

4. Create a new App registration called **openaiwp** in Microsoft Entra ID (Azure AD) using default settings.

   - **This step can be skipped if you do not plan to use the API Management service to secure access to (Azure) OpenAI endpoints.**

   - The app will be used to verify users in APIM. **openaiwp** is the default name used in web part permissions.

   - Save the App ID (Client ID). You will use it in the web part settings.

5. Review and approve access permissions for the uploaded SPFx package in the [API access section](https://yourtenant-admin.sharepoint.com/_layouts/15/online/AdminHome.aspx#/webApiPermissionManagement) of your SharePoint Online tenant.

   - **This step can be skipped if you do not plan to use the API Management service to secure access to (Azure) OpenAI endpoints.**

   - openaiwp > Azure OpenAI Chat Web Part > user_impersonation: required to verify users in APIM.

   - Microsoft Graph > People.Read and Microsoft Graph > User.Read.All: permissions needed to retrieve colleagues and other users from Azure AD.

     - These permissions are necessary only if you plan to use the feature of private chat sharing in the web part (limited to specific Azure AD accounts).

6. Add a new Site Page and insert the web part **Azure OpenAI Chat Web Part** into it.

7. Open the web part settings and configure the minimal set of required properties as follows:

   - **Client ID: create a user_impersonation app with name=openaiwp**: use the saved App ID, refer to point 4 above.

     - If you do not use APIM, retain the default value or empty it.

   - **Base URL for GPT endpoint (APIM API or full)**: You have the following options:

     - Preconfigured APIM URL for GPT 3.5: https://**yourapiminstance**.azure-api.net/openai

     - Direct URL for the native OpenAI endpoint.

       - For example, https://api.openai.com/v1/chat/completions

       - You need to have an active paid OpenAI subscription and a valid **api-key** for it.

     - Direct URL for Azure OpenAI endpoint configured for GPT 3.5 deployment.

       - For example, https://**instance**.openai.azure.com/openai/deployments/**gpt-35-turbo-16k**/chat/completions?api-version=2023-07-01-preview

       - You need to have an **api-key** for that instance.

   - **Base URL for GPT4 endpoint (APIM API or full)**: You have the following options:

     - No value, implying GPT-4 will not be used.

     - Preconfigured APIM URL for GPT 3.5: https://**yourapiminstance**.azure-api.net/openai**4**

     - Direct URL for the native OpenAI endpoint. Same as above.

       - For example, https://api.openai.com/v1/chat/completions

     - Direct URL for Azure OpenAI endpoint configured for GPT 4 deployment. Same as above.

       - For example, https://**instance**.openai.azure.com/openai/deployments/**gpt-4-32k**/chat/completions?api-version=2023-07-01-preview

   - **Base URL for Chat WebApi (APIM API or full)**: leave it empty.

     - It's not in use for the default SharePoint list storage.

     - An empty box defaults to https://**yourapiminstance**.azure-api.net/chatwebapi in case Database storage is used.

   - **Optional api-key for Azure OpenAI (for troubleshooting, not for Production)**: add your api-key if you don't use APIM.

     - The key is for native OpenAI or for Azure OpenAI, depending on your choices above.

     - It will be encrypted and stored locally in the web part settings (and displayed as \*\*\* in the Property Pane).

   - **Language models**: adjust values in the text box if you have different ones.

   - **Storage type for chat history**: keep the default SharePoint list.

   - **SharePoint list URL (leave it empty for the default URL)**: leave it empty and click on the Create button.

     - It will create a custom list called dbChats in the current site collection.

       - By default, the chat sharing option is disabled.

       - If you enable it using the corresponding checkbox below the field, click on the Update button to adjust the list's permissions.

8. Save web part settings. Reload the page.

9. Test the setup by entering any text into the prompt text area and clicking Enter.
   - The AI-response should appear in the content area.
   - Try the same with another language model (GPT-4).
   - Click on the upside arrow in the right-hand corner. Select any PDF file - for example, from ./docs folder - click OK to upload it. Click on the Submit button to summarize the uploaded PDF.

# Full-Scale Setup for Large Environments 
  - [back to the top](#quick-links)

**Prerequisites**:

- You should hold the role of an Entra Global Administrator.
- You should have the ability to create and configure Azure OpenAI service, API Management service, App Service, Azure SQL database, App registrations and permissions, as well as SharePoint Online site collections.

## Configurations

Please refer to the product documentation in [azure-openai-chat-web-part.pdf](https://github.com/Paul-Borisov/Azure-OpenAI-Chat-Webpart/tree/main/docs/azure-openai-chat-web-part.pdf) and [azure-openai-chat-security.pdf](https://github.com/Paul-Borisov/Azure-OpenAI-Chat-Webpart/tree/main/docs/azure-openai-chat-security.pdf)
