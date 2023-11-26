import { core, db } from '@/app'
import { Component } from '@/discord/base'
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, codeBlock, type AnyComponentBuilder, type CacheType, type ColorResolvable, type CommandInteraction, type Guild, type MessageInteraction, type PermissionResolvable, type TextChannel } from 'discord.js'
import { genButtonID } from './GenButton'

export function createRow<Component extends AnyComponentBuilder = AnyComponentBuilder> (...components: Component[]): ActionRowBuilder<Component> {
  return new ActionRowBuilder<Component>({ components })
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Discord {
  /**
     * Registra um log de aviso no canal de logs do Discord.
     * @param message A mensagem do log.
     */
  public static async sendLog (options: {
    interaction: CommandInteraction<CacheType> | MessageInteraction | ButtonInteraction<CacheType> | MessageInteraction | null
    guild: Guild | null
    type: string
    cause: string
    color: ColorResolvable
    infos: any
  }): Promise<void> {
    try {
      const { interaction, guild, type, cause, color, infos } = options

      let title = ''
      let name = ''
      let value = ''

      const logsDB = await db.guilds.get(`${guild?.id}.channel.logs`) as string
      const logsChannel = guild?.channels.cache.get(logsDB) as TextChannel

      switch (type) {
        case 'warn': {
          title = '⚠️ Aviso'
          break
        }
      }

      switch (cause) {
        case 'noPermission': {
          if (!(interaction instanceof ButtonInteraction)) {
            name = 'Usuário sem permissão tentou executar um comando'
            value = `<@${interaction?.user.id}> Tentou usar o comando` + codeBlock(`/${interaction?.commandName}`)
          }
          break
        }
        case 'noPermissionBanKick': {
          const [{ userID, reason, actionType }] = infos
          name = 'Usuário sem permissão tentou executar um comando'
          value = `<@${interaction?.user.id}> Tentou ${actionType} o usuário <@${userID}>\nMotivo: ${reason}`
          break
        }
        case 'messageDelete': {
          name = 'Mensagem apagada era uma embed do sistema!'
          value = 'Alguém Apagou uma mensagem que em teoria não poderia!\nDeletando mensagem do Database...'
          break
        }
      }

      console.log(title, name, value)

      const embed = new EmbedBuilder()
        .setTitle(title)
        .addFields({
          name,
          value
        })
        .setColor(color ?? 'Random')

      if (logsChannel !== undefined) {
        await logsChannel.send({ embeds: [embed] })
      }
    } catch (err: any) {
      console.error(`Erro ao criar log de aviso: ${err}`)
    }
  }

  public static async Permission (
    interaction: CommandInteraction<CacheType> | ButtonInteraction<CacheType>,
    typePermission: PermissionResolvable,
    typeLog?: string
  ): Promise<boolean> {
    try {
      const guild = interaction.guild as Guild
      if ((interaction?.memberPermissions?.has(typePermission)) === false) {
        await interaction.reply({
          content: '**❌ - Você não possui permissão para executar essa ação.**',
          ephemeral: true
        })
        await Discord.sendLog({
          interaction,
          guild,
          type: 'warn',
          cause: typeLog ?? 'noPermission',
          color: 'Orange',
          infos: []
        })
        return true
      }
      return false
    } catch (err: any) {
      console.error(`Erro ao verificar permissão: ${err}`)
      return true
    }
  }

  /**
   * Cria um botão de Redirecionamento
   */
  public static async buttonRedirect (options: {
    guildId: string | null
    channelId: string | null
    emoji?: string
    label: string
  }): Promise<ActionRowBuilder<ButtonBuilder>> {
    const { guildId, channelId, emoji, label } = options
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      await CustomButtonBuilder.create({
        emoji,
        label,
        url: `https://discord.com/channels/${guildId}/${channelId}`,
        style: ButtonStyle.Link
      })
    )
  }

  /**
   * Calcula o tempo que demora para um component responder.
   */
  public static async registerComponent (options: {
    type: 'Button' | 'StringSelect' | 'RoleSelect' | 'ChannelSelect' | 'UserSelect' | 'MentionableSelect' | 'Modal'
    customId: string
    run: (interaction: any) => any
  }): Promise<Component> {
    const { customId, type, run: runCallback } = options
    return new Component({
      customId,
      type,
      async run (interaction: any) {
        const start = Date.now()
        await runCallback(interaction)
        const end = Date.now()
        const timeSpent = (end - start) / 1000 + 's'
        core.info(`${type} | ${interaction.customId} | ${timeSpent} | ${interaction.user.username}`)
      }
    })
  }
}

export class CustomButtonBuilder extends ButtonBuilder {
  customId?: string
  emoji?: string
  style?: ButtonStyle
  url?: string
  label?: string
  constructor (customId?: string, emoji?: string, style?: ButtonStyle, url?: string, label?: string) {
    super()
    this.customId = customId
    this.emoji = emoji
    this.style = style
    this.url = url
    this.label = label
  }

  async init (): Promise<this> {
    const { Id } = await genButtonID()
    if (this.customId !== undefined) this.setCustomId(`${Id}_${this.customId}`)
    if (this.emoji !== undefined) this.setEmoji(this.emoji)
    if (this.style !== undefined) this.setStyle(this.style)
    if (this.url !== undefined) this.setURL(this.url)
    if (this.label !== undefined) this.setLabel(this.label)
    return this
  }

  static async create ({ customId, emoji, style, url, label }: any): Promise<CustomButtonBuilder> {
    const builder = new CustomButtonBuilder(customId, emoji, style, url, label)
    return await builder.init()
  }
}
