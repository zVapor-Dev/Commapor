# Commapor 🤖💼

Commapor is an advanced command handler for discord.js v14, equipped with powerful features like MongoDB connection and more.

## Installation 🚀

Install Commapor using npm:

```bash
npm i @zvapor-dev/commapor
```

## Usage 📋

```javascript
const { Client } = require('discord.js');
const Commapor = require('@zvapor-dev/commapor');
const path = require("path");

const client = new Client({
  // ...
});

const commapor = new Commapor(client, {
  client,
  mongoURI: 'mongodb://localhost:27017/mydatabase',
  commandsDir: path.join(__dirname, "commands"),
  testServers: [""],
  botOwners: [""]

});

client.login('YOUR_DISCORD_BOT_TOKEN');
```

## Features 🌟

- **Advanced Command Handling**: Easily manage and handle commands in your Discord bot.

- **MongoDB Integration**: Connect seamlessly to MongoDB for efficient data storage.

- **Test Servers Configuration**: Specify test servers to prevent unwanted command execution during testing.

- **Bot Owners Configuration**: Define bot owners to have exclusive access to certain commands or functionalities.

## Contributing 🤝

Contributions are always welcome! If you find any bugs or have suggestions for improvements, feel free to open an issue or submit a pull request.

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your branch to your fork.
5. Open a pull request to the `main` branch of the original repository.

## License 📄

Commapor is released under the MIT License. See [LICENSE](LICENSE) for more information.

## Contact 📧

For any questions or concerns, please contact the project maintainer:

- Maintainer: zVapor_
- Email: contact@zvapor.xyz

## Acknowledgments 👏

Commapor relies on the efforts of open-source contributors. Thanks to everyone who has contributed to making this project better.

---

**Note**: Replace [Your Name] and [your.email@example.com] with your information.
