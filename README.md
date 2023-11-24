# Azure OpenAI Chat Webpart

This is Azure OpenAI Chat Web Part for SharePoint Online. It has look-and-feel familiar to users of ChatGPT.

The web part supports Azure OpenAI and native OpenAI endpoints secured with Azure API Management (APIM).

- APIM authenticates users and injects **api-key** into requests before forwarding them to endpoints. **api-key** does not travel in the browser.
- Using native OpenAI endpoints may provide you access the newest models like gpt-4-vision-preview and gpt-4-1106-preview not yet available in Azure OpenAI (Nov 2023).
- You can also use straight access to endpoints configured with api-key.
  - **This is less secure setup**, which is not recommended for Production, but can be used for evaluations.
  - The stored key is encrypted in web part properties using AES. However, it will travel in the browser and can be seen inside DEV tools > Network > Request headers.
