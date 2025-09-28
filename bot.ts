import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  PermissionsBitField,
  ActivityType,
} from "discord.js";
import { config } from "dotenv";
import { storage } from "./storage";

// Load environment variables
config();

// Banned words list for auto-moderation
const bannedWords = [
  "automodmelapela",
  "nigga",
  "nigger",
  "nsfw",
  "dick",
  "rule 34",
  "rl34",
  "hentai",
  "nude",
  "porn",
  "hentai",
  "loli",
  "childporn",
  "cp",
  "pornhub",
  "xvideos",
  "09/11",
];

// Status rotation
const statuses = [
  { name: "hOI! welcom to da profil 😼", type: ActivityType.Listening },
  { name: "DELTAPAPUS | t$help", type: ActivityType.Watching },
];

const premiumUsers: string[] = [
  "imtassingg", // Usuario 1
  "987654321098765432", // Usuario 2
];


// Aquí guardamos si el modo premium está activo
export const premiumToggle = {
  name: "premium",
  description: "Muestra si estás en modo premium",
  execute: async (message: Message, args: string[]) => {
    if (premiumUsers.includes(message.author.id)) {
      await message.reply("✨ ¡Eres un usuario premium!");
    } else {
      await message.reply("⚡ No eres premium.");
    }
  },
};

// lista negra de servers (IDs)

// Bot command interface
interface BotCommand {
  data: any; // SlashCommandBuilder or SlashCommandOptionsOnlyBuilder
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

interface TextCommand {
  name: string;
  description: string;
  execute: (message: Message, args: string[]) => Promise<void>;
}

class TemmieBot {
  private client: Client;
  private commands: Collection<string, BotCommand>;
  private textCommands: Collection<string, TextCommand>;
  private readonly prefix = "t$";

  constructor() {
    // Initialize Discord client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.commands = new Collection();
    this.textCommands = new Collection();

    this.setupEventHandlers();
    this.initializeCommands();
  }

  private setupEventHandlers() {
    // Bot ready event
    this.client.once(Events.ClientReady, (readyClient) => {
      console.log(`${readyClient.user.tag} está listo 😎`);
      console.log(`📊 Serving ${readyClient.guilds.cache.size} servers`);

      // Status rotation system
      const changeStatus = () => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        this.client.user?.setPresence({
          activities: [status],
          status: "dnd",
        });
      };

      changeStatus(); // Set initial status
      setInterval(changeStatus, 5000); // Change status every 5 seconds

      // Register servers in storage
      this.registerServers();
    });

    // Guild join event with DM to owner
    this.client.on(Events.GuildCreate, async (guild) => {
      console.log(
        `📈 Joined new server: ${guild.name} (${guild.memberCount} members)`,
      );

      app.post("/award-role", async (req: Request, res: Response) => {
        const { secret, userId, guildId, roleId } = req.body;

        const client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
          ],
        });
        const SECRET = "1408971645569335420";

        if (secret !== SECRET) {
          return res
            .status(403)
            .json({ success: false, message: "Clave inválida" });
        }

        if (!userId || !guildId || !roleId) {
          return res
            .status(400)
            .json({ success: false, message: "Faltan campos" });
        }

        try {
          const guild = await client.guilds.fetch(guildId);
          const member = await guild.members.fetch(userId);

          await member.roles.add(roleId, "1420244242449825864");

          return res.json({ success: true, message: "Rol asignado con éxito" });
        } catch (err: any) {
          console.error("❌ Error asignando rol:", err);
          return res.status(500).json({ success: false, message: err.message });
        }
      });

      try {
        const owner = await guild.fetchOwner();
        await owner.send(
          "oLa soI temY, ahOrA soI tu aMigA eN ${guild.name}: siuuUUUUUU 😎🎉",
        );
        console.log(`Mensaje enviado al dueño de ${guild.name}`);
      } catch (error) {
        console.error(`No se pudo enviar DM al dueño de ${guild.name}:`, error);
      }

      await storage.createDiscordServer({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount || 0,
      });
    });

    // Guild member join event - Welcome message
    this.client.on(Events.GuildMemberAdd, async (member) => {
      const channelId = "1408999982564114472"; // Welcome channel ID
      const channel = member.guild.channels.cache.get(channelId);
      if (!channel)
        return console.error("❌ No encontré el canal de bienvenida");

      if (channel.isTextBased()) {
        await channel.send(`👋 hOI ${member.user}! welcom to da server!! 🎉✨`);
      }
    });

    // Guild leave event
    this.client.on(Events.GuildDelete, (guild) => {
      console.log(`📉 Left server: ${guild.name}`);
    });

    // Slash command interaction handler
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) {
        console.error(
          `❌ No command matching ${interaction.commandName} was found.`,
        );
        return;
      }

      try {
        // Log command usage
        await storage.logCommandUsage({
          commandName: interaction.commandName,
          userId: interaction.user.id,
          serverId: interaction.guildId || "DM",
        });

        // Update command usage count
        await storage.updateBotCommandUsage(interaction.commandName);

        await command.execute(interaction);
      } catch (error) {
        console.error("❌ Error executing slash command:", error);

        const errorMessage = "There was an error while executing this command!";
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: errorMessage,
            ephemeral: true,
          });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    });

    // Message handler with auto-moderation and text commands
    this.client.on(Events.MessageCreate, async (message) => {
      // Ignore bot messages
      if (message.author.bot) return;

      const content = message.content.toLowerCase();

      // 🔹 AUTO-MODERATION - Check for banned words
      if (bannedWords.some((word) => content.includes(word.toLowerCase()))) {
        try {
          await message.delete();
          await message.channel.send(
            `🚫 ${message.author}, esa palabra está prohibida aquí. Si sigues así con ese comportamiento podrás ser castigado.
            -# TemmieMod`,
          );

          // Add automatic warning case
          if (message.guildId) {
            const caseNumber = await storage.getNextCaseNumber(
              message.guildId,
              message.author.id,
            );
          }
        } catch (error) {
          console.error("Error in auto-moderation:", error);
        }
        return; // Don't process commands if message contained banned words
      }

      // Check if message starts with prefix
      if (!message.content.startsWith(this.prefix)) return;

      const args = message.content.slice(this.prefix.length).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const command = this.textCommands.get(commandName);
      if (!command) return;

      try {
        // Log command usage
        await storage.logCommandUsage({
          commandName: commandName,
          userId: message.author.id,
          serverId: message.guildId || "DM",
        });

        // Update command usage count
        await storage.updateBotCommandUsage(commandName);

        await command.execute(message, args);
      } catch (error) {
        console.error("❌ Error executing text command:", error);
        await message.reply("There was an error while executing this command!");
      }
    });

    // Error handling
    this.client.on("error", (error) => {
      console.error("Discord client error:", error);
    });
  }

  private async initializeCommands() {
    // Initialize slash commands
    await this.initializeSlashCommands();
    // Initialize text commands
    await this.initializeTextCommands();
  }

  private async initializeSlashCommands() {
    // Basic commands
    const pingCommand: BotCommand = {
      data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Prueba la respuesta del bot"),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply("🏓 ¡Pong!");
      },
    };

    const temmieCommand: BotCommand = {
      data: new SlashCommandBuilder()
        .setName("temmie")
        .setDescription("Temmie te saluda"),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply("Hola soy temmie");
      },
    };

    const saluditosCommand: BotCommand = {
      data: new SlashCommandBuilder()
        .setName("saluditos")
        .setDescription("Mensaje de bienvenida oficial de DELTAPAPUS"),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply(
          "Hola, soy Temmie, el bot oficial de DELTAPAPUS, bienvenido al server! Espero disfrutes la estadía, recuerda pasarte por las reglas y chau.",
        );
      },
    };

    const helpCommand: BotCommand = {
      data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Muestra todos los comandos disponibles"),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const embed = new EmbedBuilder()
          .setTitle("🤖 Temmie Bot Commands")
          .setDescription("Here are all available commands:")
          .setColor(0x5865f2)
          .addFields(
            {
              name: "🏓 /ping",
              value: "Prueba la respuesta del bot",
              inline: true,
            },
            { name: "👋 /temmie", value: "Temmie te saluda", inline: true },
            {
              name: "🎉 /saluditos",
              value: "Mensaje de bienvenida",
              inline: true,
            },
            { name: "❓ /help", value: "Muestra este mensaje", inline: true },
            { name: "🔨 /ban", value: "Banea a un usuario", inline: true },
            {
              name: "⏱️ /timeout",
              value: "Pone en timeout a un usuario",
              inline: true,
            },
            {
              name: "🗑️ /purge",
              value: "Elimina múltiples mensajes",
              inline: true,
            },
            { name: "⚠️ /warn", value: "Advierte a un usuario", inline: true },
            {
              name: "📋 /cases",
              value: "Historial de moderación",
              inline: true,
            },
            { name: "\u200B", value: "\u200B" },
            {
              name: "📝 Text Commands",
              value: "También puedes usar comandos de texto con `t$`",
              inline: false,
            },
          )
          .setFooter({
            text: "Temmie Bot for DELTAPAPUS",
            iconURL: this.client.user?.avatarURL() || undefined,
          });

        await interaction.reply({ embeds: [embed] });
      },
    };

    // Moderation commands
    const banCommand: BotCommand = {
      data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Banea a un usuario del servidor")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario a banear")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("razon")
            .setDescription("Razón del ban")
            .setRequired(false),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        if (
          !interaction.memberPermissions?.has(
            PermissionsBitField.Flags.BanMembers,
          )
        ) {
          await interaction.reply({
            content: "❌ No tienes permisos para banear usuarios.",
            ephemeral: true,
          });
          return;
        }

        const user = interaction.options.getUser("usuario", true);
        const reason =
          interaction.options.getString("razon") || "No se especificó razón";

        try {
          await interaction.guild?.members.ban(user.id, { reason });

          if (interaction.guildId) {
            const caseNumber = await storage.getNextCaseNumber(
              interaction.guildId,
              user.id,
            );
            await storage.addModerationCase({
              serverId: interaction.guildId,
              userId: user.id,
              caseNumber,
              type: "ban",
              reason,
              moderatorId: interaction.user.id,
              moderatorTag: interaction.user.tag,
            });
            await interaction.reply(
              `✅ ${user.username} ha sido baneado. Caso #${caseNumber}. Razón: ${reason}`,
            );
          }
        } catch (error) {
          await interaction.reply({
            content: "❌ No pude banear a ese usuario.",
            ephemeral: true,
          });
        }
      },
    };

    const timeoutCommand: BotCommand = {
      data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Pone en timeout a un usuario")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario a poner en timeout")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("minutos")
            .setDescription("Duración del timeout en minutos (1-10080)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10080),
        )
        .addStringOption((option) =>
          option
            .setName("razon")
            .setDescription("Razón del timeout")
            .setRequired(false),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        if (
          !interaction.memberPermissions?.has(
            PermissionsBitField.Flags.ModerateMembers,
          )
        ) {
          await interaction.reply({
            content: "❌ No tienes permisos para poner usuarios en timeout.",
            ephemeral: true,
          });
          return;
        }

        const user = interaction.options.getUser("usuario", true);
        const minutes = interaction.options.getInteger("minutos", true);
        const reason =
          interaction.options.getString("razon") || "No se especificó razón";
        const member = await interaction.guild?.members.fetch(user.id);

        try {
          await member?.timeout(minutes * 60 * 1000, reason);

          if (interaction.guildId) {
            const caseNumber = await storage.getNextCaseNumber(
              interaction.guildId,
              user.id,
            );
            await storage.addModerationCase({
              serverId: interaction.guildId,
              userId: user.id,
              caseNumber,
              type: "timeout",
              reason,
              moderatorId: interaction.user.id,
              moderatorTag: interaction.user.tag,
            });
            await interaction.reply(
              `✅ ${user.username} ha sido puesto en timeout por ${minutes} minutos. Caso #${caseNumber}. Razón: ${reason}`,
            );
          }
        } catch (error) {
          await interaction.reply({
            content: "❌ No pude poner en timeout a ese usuario.",
            ephemeral: true,
          });
        }
      },
    };

    const purgeCommand: BotCommand = {
      data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Elimina múltiples mensajes")
        .addIntegerOption((option) =>
          option
            .setName("cantidad")
            .setDescription("Cantidad de mensajes a eliminar (1-100)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        if (
          !interaction.memberPermissions?.has(
            PermissionsBitField.Flags.ManageMessages,
          )
        ) {
          await interaction.reply({
            content: "❌ No tienes permisos para eliminar mensajes.",
            ephemeral: true,
          });
          return;
        }

        const amount = interaction.options.getInteger("cantidad", true);

        try {
          if (interaction.channel && "bulkDelete" in interaction.channel) {
            await interaction.channel.bulkDelete(amount);
            await interaction.reply({
              content: `✅ Se eliminaron ${amount} mensajes.`,
              ephemeral: true,
            });
          }
        } catch (error) {
          await interaction.reply({
            content: "❌ No pude eliminar los mensajes.",
            ephemeral: true,
          });
        }
      },
    };

    const warnCommand: BotCommand = {
      data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Advierte a un usuario")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario a advertir")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("razon")
            .setDescription("Razón de la advertencia")
            .setRequired(true),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        if (
          !interaction.memberPermissions?.has(
            PermissionsBitField.Flags.ModerateMembers,
          )
        ) {
          await interaction.reply({
            content: "❌ No tienes permisos para advertir usuarios.",
            ephemeral: true,
          });
          return;
        }

        const user = interaction.options.getUser("usuario", true);
        const reason = interaction.options.getString("razon", true);

        if (interaction.guildId) {
          const caseNumber = await storage.getNextCaseNumber(
            interaction.guildId,
            user.id,
          );
          await storage.addModerationCase({
            serverId: interaction.guildId,
            userId: user.id,
            caseNumber,
            type: "warn",
            reason,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
          });
          await interaction.reply(
            `✅ ${user.username} ha sido advertido. Caso #${caseNumber}. Razón: ${reason}`,
          );
        }
      },
    };

    const casesCommand: BotCommand = {
      data: new SlashCommandBuilder()
        .setName("cases")
        .setDescription("Muestra el historial de moderación de un usuario")
        .addUserOption((option) =>
          option
            .setName("usuario")
            .setDescription("Usuario del que ver el historial")
            .setRequired(true),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.options.getUser("usuario", true);

        if (!interaction.guildId) return;

        const cases = await storage.getModerationCases(
          interaction.guildId,
          user.id,
        );

        if (cases.length === 0) {
          await interaction.reply(
            `📋 ${user.username} no tiene casos de moderación.`,
          );
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle(`📋 Casos de Moderación - ${user.username}`)
          .setColor(0xff6b6b);

        cases.forEach((c) => {
          embed.addFields({
            name: `Caso #${c.caseNumber} - ${c.type.toUpperCase()}`,
            value: `**Razón:** ${c.reason}\n**Moderador:** ${c.moderatorTag}\n**Fecha:** ${c.createdAt?.toDateString()}`,
            inline: false,
          });
        });

        await interaction.reply({ embeds: [embed] });
      },
    };

    // Add commands to collection
    this.commands.set(pingCommand.data.name, pingCommand);
    this.commands.set(temmieCommand.data.name, temmieCommand);
    this.commands.set(saluditosCommand.data.name, saluditosCommand);
    this.commands.set(helpCommand.data.name, helpCommand);
    this.commands.set(banCommand.data.name, banCommand);
    this.commands.set(timeoutCommand.data.name, timeoutCommand);
    this.commands.set(purgeCommand.data.name, purgeCommand);
    this.commands.set(warnCommand.data.name, warnCommand);
    this.commands.set(casesCommand.data.name, casesCommand);
  }

  private async initializeTextCommands() {
    // Define all text commands with comprehensive functionality from original bot
    const commands: TextCommand[] = [
      {
          if (premiumUsers.includes(message.author.id)) {
            await message.reply("✨ ¡Eres un usuario premium!");
          } else {
            await message.reply("⚡ No eres premium.");
          }
        },
      };
      {
        name: "temmie",
        description: "Temmie greets you",
        execute: async (message: Message, args: string[]) => {
          await message.reply("Hola soy temmie");
        },
      },
      {
        name: "saluditos",
        description: "DELTAPAPUS welcome message",
        execute: async (message: Message, args: string[]) => {
          try {
            await message.delete();
          } catch (error) {
            console.error("Cannot delete message - missing permissions");
          }
          await message.channel.send(
            "Hola, soy Temmie, el bot oficial de DELTAPAPUS, bienvenido al server! Espero disfrutes la estadía, recuerda pasarte por las reglas y chau.",
          );
        },
      },
      // Fun commands from original bot
      {
        name: "fussy",
        description: "Fussy command",
        execute: async (message: Message, args: string[]) => {
          await message.reply("<@1298883645221900301> soy mejor que tu bro");
        },
      },
      {
        name: "borrarserver",
        description: "Joke command",
        execute: async (message: Message, args: string[]) => {
          await message.reply("Borra la cuenta tu mismo, no soy tu esclavo.");
        },
      },
      {
        name: "pene",
        description: "Joke response",
        execute: async (message: Message, args: string[]) => {
          await message.reply("comes");
        },
      },
      {
        name: "tobyfox",
        description: "Toby Fox Steam profile",
        execute: async (message: Message, args: string[]) => {
          await message.reply("https://steampowered.com/id/tobyfox");
        },
      },
      {
        name: "muestrameaunbaneado",
        description: "Show a banned user",
        execute: async (message: Message, args: string[]) => {
          await message.reply("https://steamcommunity.com/id/idonttassin/");
        },
      },
      {
        name: "facto",
        description: "Show a banned user",
        execute: async (message: Message, args: string[]) => {
          await message.reply("no me des un infarto!");
        },
      },
      {
        name: "muestrameaunpendejo",
        description: "Show a pendejo",
        execute: async (message: Message, args: string[]) => {
          await message.reply("<@1298883645221900301>");
        },
      },
      {
        name: "muestrameauncarbon",
        description: "Show a carbon",
        execute: async (message: Message, args: string[]) => {
          await message.reply("<@1286891974460182559>");
        },
      },
      {
        name: "adrianasalteee",
        description: "Adriana meme",
        execute: async (message: Message, args: string[]) => {
          await message.reply(
            "### ADRIANA SALTEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
          );
        },
      },
      {
        name: "muestrameaunlimon",
        description: "Show a lemon",
        execute: async (message: Message, args: string[]) => {
          await message.reply("<@802736771930390530>");
        },
      },
      {
        name: "muestrameauninsano",
        description: "Show an insane person",
        execute: async (message: Message, args: string[]) => {
          await message.reply("<@980467296088760361>");
        },
      },

      {
        name: "echo",
        description: "Echo command (admin only)",
        execute: async (message: Message, args: string[]) => {
          if (message.author.id !== "1099816512816168970") {
            await message.reply(
              "❌ Solo mi amo ImTassingg puede usar esta vaina.",
            );
            return;
          }

          const text = args.join(" ");
          if (!text) {
            await message.reply("❌ Porfa especifica ALGO TIO");
            return;
          }

          try {
            await message.delete();
            await message.channel.send(text);
          } catch (error) {
            console.error("Error deleting message:", error);
            await message.channel.send(
              `❌ No se pudo borrar el ijueputa mensaje.${error}`,
            );
          }
        },
      },
      {
        name: "muestramealqueseasusto",
        description: "Show someone scary",
        execute: async (message: Message, args: string[]) => {
          await message.reply("<@980467296088760361>");
        },
      },
      // Special bot owner command
      {
        name: "matarbot",
        description: "Restart bot (owner only)",
        execute: async (message: Message, args: string[]) => {
          if (message.author.id !== process.env.OWNER_ID) {
            await message.reply(
              "❌ Solo el dueño del bot puede reiniciar el bot.",
            );
            return;
          }
          await message.reply("Adios mundo cruel 😭");
          console.log("🔄 Reiniciando el bot...");
          process.exit();
        },
      },
      // Role management commands
      {
        name: "addrole",
        description: "Add role to user",
        execute: async (message: Message, args: string[]) => {
          if (
            !message.member?.permissions.has(
              PermissionsBitField.Flags.ManageRoles,
            )
          ) {
            await message.reply("❌ No tienes permisos para asignar roles.");
            return;
          }

          const userArg = args[0];
          const roleArg = args[1];

          let member = message.mentions.members?.first();
          if (!member && userArg) {
            member =
              (await message.guild?.members.fetch(userArg).catch(() => null)) ||
              null;
          }

          let role = message.mentions.roles.first();
          if (!role && roleArg) {
            role = message.guild?.roles.cache.get(roleArg) || null;
          }

          if (!member || !role) {
            await message.reply(
              "⚠️ Uso correcto: `t$addrole @usuario @rol` o `t$addrole USER_ID ROLE_ID`",
            );
            return;
          }

          try {
            await member.roles.add(role);
            await message.reply(
              `✅ El rol **${role.name}** fue agregado a **${member.user.tag}**.`,
            );
          } catch (error) {
            await message.reply(
              "❌ Ocurrió un error al intentar asignar el rol.",
            );
          }
        },
      },
      {
        name: "rmvrole",
        description: "Remove role from user",
        execute: async (message: Message, args: string[]) => {
          if (
            !message.member?.permissions.has(
              PermissionsBitField.Flags.ManageRoles,
            )
          ) {
            await message.reply("❌ No tienes permisos para quitar roles.");
            return;
          }

          const userArg = args[0];
          const roleArg = args[1];

          let member = message.mentions.members?.first();
          if (!member && userArg) {
            member =
              (await message.guild?.members.fetch(userArg).catch(() => null)) ||
              null;
          }

          let role = message.mentions.roles.first();
          if (!role && roleArg) {
            role = message.guild?.roles.cache.get(roleArg) || null;
          }

          if (!member || !role) {
            await message.reply(
              "⚠️ Uso correcto: `t$rmvrole @usuario @rol` o `t$rmvrole USER_ID ROLE_ID`",
            );
            return;
          }

          try {
            await member.roles.remove(role);
            await message.reply(
              `✅ El rol **${role.name}** fue removido de **${member.user.tag}**.`,
            );
          } catch (error) {
            await message.reply(
              "❌ Ocurrió un error al intentar remover el rol.",
            );
          }
        },
      },
      // Moderation commands
      {
        name: "ban",
        description: "Ban a user",
        execute: async (message: Message, args: string[]) => {
          if (
            !message.member?.permissions.has(
              PermissionsBitField.Flags.BanMembers,
            )
          ) {
            await message.reply("❌ No tienes permisos para banear usuarios.");
            return;
          }

          const user =
            message.mentions.users.first() ||
            (await message.guild?.members.fetch(args[0]).catch(() => null));

          if (!user) {
            await message.reply(
              "❌ Debes mencionar a un usuario válido para banear.",
            );
            return;
          }

          const reason = args.slice(1).join(" ") || "No se especificó razón";

          try {
            await message.guild?.members.ban(user.id, { reason });

            if (message.guildId) {
              const caseNumber = await storage.getNextCaseNumber(
                message.guildId,
                user.id,
              );
              await storage.addModerationCase({
                serverId: message.guildId,
                userId: user.id,
                caseNumber,
                type: "ban",
                reason,
                moderatorId: message.author.id,
                moderatorTag: message.author.tag,
              });
              await message.reply(
                `✅ ${user.username} ha sido baneado. Caso #${caseNumber}. Razón: ${reason}`,
              );
            }
          } catch (error) {
            await message.reply("❌ No pude banear a ese usuario.");
          }
        },
      },
      {
        name: "timeout",
        description: "Timeout a user",
        execute: async (message: Message, args: string[]) => {
          if (
            !message.member?.permissions.has(
              PermissionsBitField.Flags.ModerateMembers,
            )
          ) {
            await message.reply(
              "❌ No tienes permisos para poner usuarios en timeout.",
            );
            return;
          }

          const user =
            message.mentions.users.first() ||
            (await message.guild?.members.fetch(args[0]).catch(() => null));

          if (!user) {
            await message.reply(
              "❌ Debes mencionar a un usuario válido para el timeout.",
            );
            return;
          }

          const minutes = parseInt(args[1]);
          if (!minutes || minutes < 1 || minutes > 10080) {
            await message.reply(
              "❌ Debes especificar una duración válida en minutos (1-10080).",
            );
            return;
          }

          const reason = args.slice(2).join(" ") || "No se especificó razón";
          const member = await message.guild?.members.fetch(user.id);

          try {
            await member?.timeout(minutes * 60 * 1000, reason);

            if (message.guildId) {
              const caseNumber = await storage.getNextCaseNumber(
                message.guildId,
                user.id,
              );
              await storage.addModerationCase({
                serverId: message.guildId,
                userId: user.id,
                caseNumber,
                type: "timeout",
                reason,
                moderatorId: message.author.id,
                moderatorTag: message.author.tag,
              });
              await message.reply(
                `✅ ${user.username} ha sido puesto en timeout por ${minutes} minutos. Caso #${caseNumber}. Razón: ${reason}`,
              );
            }
          } catch (error) {
            await message.reply("❌ No pude poner en timeout a ese usuario.");
          }
        },
      },
      {
        name: "purge",
        description: "Delete multiple messages",
        execute: async (message: Message, args: string[]) => {
          if (
            !message.member?.permissions.has(
              PermissionsBitField.Flags.ManageMessages,
            )
          ) {
            await message.reply(
              "❌ No tienes permisos para eliminar mensajes.",
            );
            return;
          }

          const amount = parseInt(args[0]);
          if (!amount || amount < 1 || amount > 100) {
            await message.reply(
              "❌ Debes especificar una cantidad válida de mensajes (1-100).",
            );
            return;
          }

          try {
            if ("bulkDelete" in message.channel) {
              await message.channel.bulkDelete(amount);
              const reply = await message.channel.send(
                `✅ Se eliminaron ${amount} mensajes.`,
              );
              setTimeout(() => reply.delete().catch(() => {}), 3000);
            }
          } catch (error) {
            await message.reply("❌ No pude eliminar los mensajes.");
          }
        },
      },
      {
        name: "warn",
        description: "Warn a user",
        execute: async (message: Message, args: string[]) => {
          if (
            !message.member?.permissions.has(
              PermissionsBitField.Flags.ModerateMembers,
            )
          ) {
            await message.reply(
              "❌ No tienes permisos para advertir usuarios.",
            );
            return;
          }

          const user = message.mentions.users.first();
          if (!user) {
            await message.reply(
              "❌ Debes mencionar a un usuario para advertir.",
            );
            return;
          }

          const reason = args.slice(1).join(" ");
          if (!reason) {
            await message.reply(
              "❌ Debes especificar una razón para la advertencia.",
            );
            return;
          }

          if (message.guildId) {
            const caseNumber = await storage.getNextCaseNumber(
              message.guildId,
              user.id,
            );
            await storage.addModerationCase({
              serverId: message.guildId,
              userId: user.id,
              caseNumber,
              type: "warn",
              reason,
              moderatorId: message.author.id,
              moderatorTag: message.author.tag,
            });
            await message.reply(
              `✅ ${user.username} ha sido advertido. Caso #${caseNumber}. Razón: ${reason}`,
            );
          }
        },
      },
      {
        name: "cases",
        description: "Show user moderation history",
        execute: async (message: Message, args: string[]) => {
          const user = message.mentions.users.first();
          if (!user || !message.guildId) {
            await message.reply("❌ Debes mencionar a un usuario válido.");
            return;
          }

          const cases = await storage.getModerationCases(
            message.guildId,
            user.id,
          );

          if (cases.length === 0) {
            await message.reply(
              `📋 ${user.username} no tiene casos de moderación.`,
            );
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle(`📋 Casos de Moderación - ${user.username}`)
            .setColor(0xff6b6b);

          cases.forEach((c) => {
            embed.addFields({
              name: `Caso #${c.caseNumber} - ${c.type.toUpperCase()}`,
              value: `**Razón:** ${c.reason}\n**Moderador:** ${c.moderatorTag}\n**Fecha:** ${c.createdAt?.toDateString()}`,
              inline: false,
            });
          });

          await message.reply({ embeds: [embed] });
        },
      },
      {
        name: "help",
        description: "Show all commands",
        execute: async (message: Message, args: string[]) => {
          const embed = new EmbedBuilder()
            .setTitle("🤖 Temmie Bot Commands")
            .setDescription("Aquí están todos los comandos disponibles:")
            .setColor(0x5865f2)
            .addFields(
              {
                name: "🏓 t$ping",
                value: "Prueba la respuesta del bot",
                inline: true,
              },
              { name: "👋 t$temmie", value: "Temmie te saluda", inline: true },
              {
                name: "🎉 t$saluditos",
                value: "Mensaje de bienvenida",
                inline: true,
              },
              { name: "🔨 t$ban", value: "Banea a un usuario", inline: true },
              {
                name: "⏱️ t$timeout",
                value: "Timeout a un usuario",
                inline: true,
              },
              {
                name: "🗑️ t$purge",
                value: "Elimina múltiples mensajes",
                inline: true,
              },
              {
                name: "⚠️ t$warn",
                value: "Advierte a un usuario",
                inline: true,
              },
              {
                name: "📋 t$cases",
                value: "Historial de moderación",
                inline: true,
              },
              {
                name: "🎭 t$addrole",
                value: "Agregar rol a usuario",
                inline: true,
              },
              {
                name: "🎭 t$rmvrole",
                value: "Quitar rol de usuario",
                inline: true,
              },
              {
                name: "🌟 t$premium",
                value: "Activa el modo Premium",
                inline: true,
              },
              { name: "\u200B", value: "\u200B" },
              {
                name: "🎮 Fun Commands",
                value:
                  "También hay comandos divertidos como `t$tobyfox`, `t$fussy`, etc.",
                inline: false,
              },
              {
                name: "⚡ Slash Commands",
                value:
                  "También puedes usar comandos slash: `/ping`, `/help`, `/ban`, etc.",
                inline: false,
              },
            )
            .setFooter({
              text: "Temmie Bot for DELTAPAPUS",
              iconURL: this.client.user?.avatarURL() || undefined,
            });

          await message.reply({ embeds: [embed] });
        },
      },
    ];

    // Register all text commands
    commands.forEach((command) => {
      this.textCommands.set(command.name, command);
    });
  }

  private async registerServers() {
    // Register all servers the bot is currently in
    const guilds = Array.from(this.client.guilds.cache.values());
    for (const guild of guilds) {
      const existingServer = await storage.getDiscordServer(guild.id);
      if (!existingServer) {
        await storage.createDiscordServer({
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount || 0,
        });
        console.log(
          `📊 Registered server: ${guild.name} (${guild.memberCount} members)`,
        );
      } else {
        // Update member count if server exists
        await storage.updateServerMemberCount(guild.id, guild.memberCount || 0);
      }
    }
  }
  // set env vars

  public async deploySlashCommands() {
    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!token || !clientId) {
      console.error(
        "❌ Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID in environment variables",
      );
      return;
    }

    const rest = new REST().setToken(token);

    try {
      console.log("🔄 Started refreshing application (/) commands.");

      const commandData = Array.from(this.commands.values()).map((command) =>
        command.data.toJSON(),
      );

      // Deploy commands globally
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData,
      });

      console.log("✅ Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error("❌ Error deploying slash commands:", error);
    }
  }

  public async start() {
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!token) {
      console.error("❌ No DISCORD_BOT_TOKEN found in environment variables");
      console.log(
        "Please set your Discord bot token in the environment variables",
      );
      return;
    }

    try {
      await this.client.login(token);

      // Deploy slash commands after successful login
      setTimeout(() => {
        this.deploySlashCommands();
      }, 2000);
    } catch (error) {
      console.error("❌ Failed to start bot:", error);
    }
  }

  public getClient(): Client {
    return this.client;
  }
}

// Export the bot instance
export const temmieBot = new TemmieBot();
export default TemmieBot;
