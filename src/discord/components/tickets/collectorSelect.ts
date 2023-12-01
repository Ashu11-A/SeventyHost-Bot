import { db } from '@/app'
import { type StringSelectMenuInteraction, type CacheType } from 'discord.js'
import { Ticket, ticketButtonsConfig } from '@/discord/components/tickets'

export async function deleteSelect (interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
  const { guildId, channelId, message } = interaction
  const { select: values } = await db.messages.get(`${guildId}.ticket.${channelId}.messages.${message?.id}`)

  if (Array.isArray(values)) {
    const deleteValues = interaction.values.map(Number)
    const updatedValues = values.filter((_: string, index: number) => !deleteValues.includes(index))

    await db.messages.set(`${guildId}.ticket.${channelId}.messages.${message?.id}.select`, updatedValues)
    await interaction.reply({
      content: '✅ Valores removidos com sucesso!',
      ephemeral: true
    })
    await ticketButtonsConfig(interaction, message)
  } else {
    console.error('Values is not an array. Handle this case appropriately.')
  }
}

export async function ticketCollectorSelect (options: {
  interaction: StringSelectMenuInteraction<CacheType>
}): Promise<void> {
  const { interaction } = options
  const { values, guildId } = interaction
  const [posição, channelId, messageID] = values[0].split('_')
  const { select: infos } = await db.messages.get(`${guildId}.ticket.${channelId}.messages.${messageID}`)
  const ticketConstructor = new Ticket({ interaction })

  if (Number(posição) >= 0 && Number(posição) < infos.length) {
    const { title, description } = infos[Number(posição)]
    await ticketConstructor.createTicket({ about: title + '\n' + description })
  } else {
    console.log('Posição inválida no banco de dados.')
    await interaction.reply({ content: '❌ | As informações do Banco de dados estão desatualizadas', ephemeral: true })
  }
  console.log(infos)
}