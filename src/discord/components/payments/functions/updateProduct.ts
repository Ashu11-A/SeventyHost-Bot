import { db } from '@/app'
import { createRowEdit } from '@/discord/events/SUEE/functions/createRowEdit'
import { CustomButtonBuilder } from '@/functions'
import { ActionRowBuilder, AttachmentBuilder, type ButtonBuilder, ButtonStyle, EmbedBuilder, MessageCollector, type APIActionRowComponent, type APIButtonComponent, type ButtonInteraction, type CacheType, type CommandInteraction, type Message, type ModalSubmitInteraction, type TextBasedChannel } from 'discord.js'
import { Check } from './checkConfig'
import { type productData } from './interfaces'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class updateProduct {
  /**
   * Atualiza/Cria os botões de configuração do Produto
   */
  public static async embed (options: {
    interaction: ModalSubmitInteraction<CacheType> | ButtonInteraction<CacheType>
    message: Message<boolean>
    button?: string
  }): Promise<void> {
    const { interaction, message, button } = options
    const { guildId, channelId, customId } = interaction
    const productData = await db.messages.get(`${guildId}.payments.${channelId}.messages.${message?.id}`) as productData
    const updateEmbed = new EmbedBuilder(productData?.embed)

    if (productData?.price !== undefined) {
      updateEmbed.addFields(
        {
          name: '💵 | Preço:',
          value: `R$${productData.price}`
        }
      )
    }
    if (productData?.properties?.paymentSetCtrlPanel && productData?.coins !== undefined) {
      updateEmbed.addFields({
        name: '🪙 | Coins:',
        value: String(productData.coins)
      })
    }

    if (productData?.role !== undefined && productData.role !== '') {
      updateEmbed.addFields({
        name: '🛂 | Você receberá o cargo:',
        value: `<@&${productData.role}>`
      })
    }

    if (productData?.embed !== undefined) {
      if (productData.embed?.color !== undefined && typeof productData.embed.color === 'string') {
        if (productData.embed.color?.startsWith('#') === true) {
          updateEmbed.setColor(parseInt(productData.embed.color.slice(1), 16))
        }
      }
    }

    await message.edit({ embeds: [updateEmbed] })
      .then(async () => {
        await db.messages.set(`${guildId}.payments.${channelId}.messages.${message?.id}.properties.${customId}`, true)
          .then(async () => {
            await this.buttonsConfig({
              interaction,
              message,
              button
            })
          })
      })
  }

  /**
 * Atualiza/Cria os botões de configuração do Produto
 */
  public static async buttonsConfig (options: {
    interaction: ModalSubmitInteraction<CacheType> | ButtonInteraction<CacheType> | CommandInteraction<'cached'>
    message: Message<boolean>
    switchBotton?: boolean
    button?: string // Isso é somente para o sistema de Edição de embeds
  }): Promise<void> {
    const { interaction, message, switchBotton, button } = options
    const { guildId, channelId } = interaction
    const productData = await db.messages.get(`${guildId}.payments.${channelId}.messages.${message.id}`) as productData

    let customId: string | undefined
    if (button !== undefined) {
      customId = button
    } else if (interaction.isButton() || interaction.isModalSubmit()) {
      customId = interaction.customId
    }

    async function createSecondaryRow (): Promise<ActionRowBuilder<ButtonBuilder>> {
      const row2Buttons = [
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_SetPrice',
          label: 'Preço',
          emoji: '💰'
        }),
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_SetRole',
          label: 'Add Cargo',
          emoji: '🛂'
        }),
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_Export',
          label: 'Exportar',
          emoji: '📤'
        }),
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_Import',
          label: 'Importar',
          emoji: '📥'
        })
      ]

      let componetUpdate: string = ''
      for (const value of row2Buttons) {
        const { custom_id: customID } = Object(value.toJSON())
        if (productData?.properties?.[customID] !== undefined) {
          value.setStyle(ButtonStyle.Primary)
        } else {
          value.setStyle(ButtonStyle.Secondary)
        }
        componetUpdate += (customID + ' ')
      }
      console.log('Atualizando os componentes: ', componetUpdate)
      return new ActionRowBuilder<ButtonBuilder>().addComponents(...row2Buttons)
    }

    async function createThirdRow (): Promise<ActionRowBuilder<ButtonBuilder>> {
      const redeemSystem = [
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_SetEstoque',
          label: 'Estoque',
          emoji: '🗃️',
          style: ButtonStyle.Secondary
        }),
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_AddEstoque',
          label: 'Add Estoque',
          emoji: '➕',
          style: ButtonStyle.Secondary,
          disabled: true
        }),
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_SetCtrlPanel',
          label: 'CrtlPanel',
          emoji: '💻',
          style: ButtonStyle.Secondary
        }),
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_AddCoins',
          label: 'Moedas',
          emoji: '🪙',
          style: ButtonStyle.Secondary,
          disabled: true
        })
      ]
      let componetUpdate: string = ''
      for (const value of redeemSystem) {
        const { custom_id: customID } = Object(value.toJSON())
        if (productData?.properties?.[customID]) {
          value.setStyle(ButtonStyle.Primary)
        } else {
          value.setStyle(ButtonStyle.Secondary)
        }

        if (customID === 'Product_Admin_AddEstoque' && productData?.properties?.paymentSetEstoque) {
          value.setDisabled(false)
        }
        if (customID === 'Product_Admin_AddCoins' && productData?.properties?.paymentSetCtrlPanel) {
          value.setDisabled(false)
          if (productData?.coins !== undefined) {
            value.setStyle(ButtonStyle.Primary)
          } else {
            value.setStyle(ButtonStyle.Secondary)
          }
        }
        componetUpdate += (customID + ' ')
      }
      console.log('Atualizando os componentes: ', componetUpdate)
      return new ActionRowBuilder<ButtonBuilder>().addComponents(...redeemSystem)
    }

    async function createFooterRow (): Promise<ActionRowBuilder<ButtonBuilder>> {
      const footerBar = [
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_Save',
          label: 'Salvar',
          emoji: '✔️',
          style: ButtonStyle.Success
        }),
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_Status',
          label: 'Ativar/Desativar'
        }),
        await CustomButtonBuilder.create({
          customId: 'Product_Admin_Delete',
          label: 'Apagar Produto',
          emoji: '✖️',
          style: ButtonStyle.Danger
        })
      ]
      let componetUpdate: string = ''
      for (const value of footerBar) {
        const { custom_id: customID } = Object(value.toJSON())
        if (customID === 'Product_Admin_Status') {
          if (productData?.status) {
            value.setLabel('Ativado')
              .setEmoji('✅')
              .setStyle(ButtonStyle.Primary)
          } else {
            value.setLabel('Desativado')
              .setEmoji('❌')
              .setStyle(ButtonStyle.Secondary)
          }
        }
        componetUpdate += (customID + ' ')
      }
      console.log('Atualizando os componentes: ', componetUpdate)
      return new ActionRowBuilder<ButtonBuilder>().addComponents(...footerBar)
    }

    // Mapeia o customId para o número da fileira
    const buttonRowMap: Record<string, number> = {
      SetName: 1,
      SetDesc: 1,
      SetMiniature: 1,
      SetBanner: 1,
      SetColor: 1,
      SetPrice: 2,
      SetRole: 2,
      Export: 2,
      Import: 2,
      SetEstoque: 3,
      AddEstoque: 3,
      SetCtrlPanel: 3,
      AddCoins: 3,
      Save: 4,
      Status: 4,
      Delete: 4
    }

    if (message.components[1] !== undefined || (customId !== undefined && customId !== 'paymentConfig')) {
      const rowNumber: number | undefined = customId === undefined ? undefined : buttonRowMap[customId]

      if (typeof rowNumber === 'number') {
        // Chama a função apropriada com base no número da fileira
        let updatedRow: APIActionRowComponent<APIButtonComponent> | null = null

        switch (rowNumber) {
          case 1:
            updatedRow = (await createRowEdit(interaction, message, 'payments')).toJSON()
            break
          case 2:
            updatedRow = (await createSecondaryRow()).toJSON()
            break
          case 3:
            updatedRow = (await createThirdRow()).toJSON()
            break
          case 4:
            updatedRow = (await createFooterRow()).toJSON()
            break
        }
        if (updatedRow !== null) {
        // Atualize apenas a fileira relevante
          const components: any[] = [
            ...message.components
          ]
          components[rowNumber - 1] = updatedRow

          await message.edit({ components })
        }
      } else {
        await interaction.editReply({
          content: '❌ | Ocorreu um erro!'
        })
      }
    } else {
      const row1 = await createRowEdit(interaction, message, 'payments')
      const row2 = await createSecondaryRow()
      const row3 = await createThirdRow()
      const row4 = await createFooterRow()
      await message.edit({ components: [row1, row2, row3, row4] })
      if (switchBotton === true) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder({
              title: 'Modo de Edição Ativado.'
            }).setColor('Green')
          ]
        })
      }
    }
  }

  /**
   * Muda os botões para os usuários (Modo Produção)
   */
  public static async buttonsUsers (options: {
    interaction: CommandInteraction<'cached'> | ButtonInteraction<CacheType>
    message: Message<boolean>
  }): Promise<void> {
    const { interaction, message } = options
    const { guildId, channelId } = interaction
    const productData = await db.messages.get(`${guildId}.payments.${channelId}.messages.${message.id}`) as productData

    const checkRes = await Check.product({ interaction, productData })
    if (!checkRes[0]) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: '⚠️ Faltam configurar algumas propriedades!',
            description: checkRes[1]
          }).setColor('Red')
        ]
      })
      return
    }

    const row1Buttons = [
      await CustomButtonBuilder.create({
        customId: 'Product_User_Buy',
        label: 'Adicionar ao Carrinho',
        style: ButtonStyle.Success,
        emoji: '🛒'
      }),
      await CustomButtonBuilder.create({
        customId: 'Product_Admin_Config',
        style: ButtonStyle.Secondary,
        emoji: '⚙️'
      })
    ]

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(...row1Buttons)

    for (const value of row1Buttons) {
      const { custom_id: customID } = Object(value.toJSON())
      if (customID === 'Buy') {
        if (productData?.status !== undefined && productData.status) {
          value.setDisabled(false)
        } else {
          value.setDisabled(true)
        }
      }
    }

    const clearData = { components: [] }

    await message.edit({ ...clearData, components: [row1] })
    await interaction.editReply({
      embeds: [
        new EmbedBuilder({
          title: 'Modo de Produção Ativado.'
        }).setColor('Green')
      ]
    })
  }

  /**
   * Exporta o produto em um arquivo.json
   */
  public static async export (options: {
    interaction: ButtonInteraction<CacheType> | ModalSubmitInteraction<CacheType>
    message: Message<boolean>
  }): Promise<void> {
    const { interaction, message } = options
    const { guildId, channelId } = interaction

    const productData = await db.messages.get(`${guildId}.payments.${channelId}.messages.${message.id}`) as productData
    const jsonData = JSON.stringify(productData, (key, value) => {
      if (typeof value === 'string') {
        return value.replace(/`/g, '\\`')
      }
      return value
    }, 4)
    const buffer = Buffer.from(jsonData, 'utf-8')
    const attachment = new AttachmentBuilder(buffer, { name: `product_${message.id}.json` })
    await interaction.editReply({
      files: [attachment]
    })
  }

  /**
   * Importa um produto de um arquivo.json
   */
  public static async import (options: {
    interaction: ButtonInteraction<CacheType> | ModalSubmitInteraction<CacheType>
    message: Message<boolean>
  }): Promise<void> {
    const { interaction, message } = options
    const { guildId, channelId } = interaction
    const now = new Date()
    const futureTime = new Date(
      now.getTime() + 60000
    )
    await interaction.editReply({
      embeds: [new EmbedBuilder({
        title: 'Envie o arquivo Json.',
        description: `Tempo restante: <t:${Math.floor(
          futureTime.getTime() / 1000
        )}:R>`
      }).setColor('Blue')]
    }).then(async () => {
      const collector = new MessageCollector(interaction.channel as TextBasedChannel, {
        max: 1,
        time: 60000
      })

      collector.on('collect', async (subInteraction) => {
        try {
          const file = subInteraction.attachments.first()
          console.log(file)

          if (file === undefined) {
            await interaction.followUp({ ephemeral, content: 'Isso não me parece um arquivo!' })
            await subInteraction.delete()
            return
          }

          const fileName = file.name
          if (!fileName.endsWith('.json')) {
            await interaction.followUp({ ephemeral, content: 'O arquivo enviado não é um JSON válido.' })
            await subInteraction.delete()
            return
          }

          const fileUrl = file.url
          const response = await fetch(fileUrl)

          if (response.ok) {
            const jsonData = await response.json()
            const cleanedJsonData = JSON.stringify(jsonData).replace(/\\\\`/g, '`')

            await interaction.followUp({
              ephemeral,
              embeds: [new EmbedBuilder({
                title: 'Arquivo JSON recebido!'
              }).setColor('Green')]
            })

            await subInteraction.delete()
            collector.stop()

            const json = JSON.parse(cleanedJsonData)
            delete json.id
            console.log(json)
            const productData = await db.messages.get(`${guildId}.payments.${channelId}.messages.${message?.id}`) as productData
            await db.messages.set(`${guildId}.payments.${channelId}.messages.${message?.id}`, {
              id: productData.id,
              ...json
            })
            if (message !== null) {
              await this.embed({
                interaction,
                message
              })
              await interaction.followUp({
                ephemeral,
                embeds: [new EmbedBuilder({
                  title: 'Dados Atualizados!',
                  description: 'As informações do produto foram alteradas!'
                }).setColor('Green')]
              })
            }
          }
        } catch (error) {
          console.error(error)
          await interaction.followUp({ ephemeral, content: 'Ocorreu um erro ao coletar o arquivo.' })
          await subInteraction.delete()
        }
      })
      collector.on('end', async () => {
        await interaction.followUp({
          ephemeral,
          embeds: [new EmbedBuilder({
            title: 'Coletor foi desativado.'
          })]
        })
      })
    })
  }

  /**
   * name
   */
  public static async paymentStatus (options: {
    interaction: ButtonInteraction<CacheType>
    message: Message<boolean>
  }): Promise<void> {
    const { interaction, message } = options
    const { guildId, channelId } = interaction
    let { status } = await db.messages.get(`${guildId}.payments.${channelId}.messages.${message.id}`) as productData
    if (status === undefined || !status) {
      status = true
    } else {
      status = false
    }

    await db.messages.set(`${guildId}.payments.${channelId}.messages.${message.id}.status`, status)
    await this.buttonsConfig({ interaction, message })
    const embed = new EmbedBuilder({
      title: `Produto ${status ? 'Ativado' : 'Desativado'} com sucesso.`
    })
    if (status) {
      embed.setColor('Green')
    } else {
      embed.setColor('Red')
    }
    await interaction.editReply({
      embeds: [embed]
    }
    )
  }
}
