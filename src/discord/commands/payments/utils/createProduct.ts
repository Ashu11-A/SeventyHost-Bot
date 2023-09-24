import { type TextChannel, type CommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, type Message } from 'discord.js'

import { db } from '@/app'
import { updateProduct } from './updateProduct'

export default async function sendEmbed (interaction: CommandInteraction<'cached'>, channel: TextChannel): Promise<void> {
  const { guildId, channelId } = interaction
  const icon = interaction.guild.iconURL({ size: 2048 }) as string ?? undefined
  const embed = new EmbedBuilder({
    title: 'Plano',
    description: '```' + 'Sem nenhuma descrição' + '```',
    thumbnail: { url: icon },
    image: { url: icon }
  }).setColor('Blue')

  const embedJson = embed.toJSON()

  await channel.send({ embeds: [embed.addFields({ name: '💵 | Preço:', value: 'R$0,00' })] })
    .then(async (message: Message<true>) => {
      await db.messages.set(`${guildId}.payments.${channelId}.messages.${message.id}`,
        {
          id: message.id,
          embed: embedJson
        })
      await updateProduct.buttonsConfig({
        interaction,
        message
      })
      await interaction.editReply({
        content: '✅ | Item criado com sucesso!',
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('Clique para ir a mensagem')
              .setURL(message.url)
              .setStyle(ButtonStyle.Link)
          )
        ]
      })
    })
}