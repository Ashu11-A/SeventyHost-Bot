import { type Request, type Response } from 'express'
import { MercadoPagoConfig, Payment } from 'mercadopago'

class CreatePixPayment {
  /**
     * Cria um pedido de pagamento para o Mercado Pago
     */
  public async post (req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined> {
    const { userName, userId, mpToken, valor } = req.body

    console.log(Math.round(valor))

    if (
      userName === undefined ||
        userId === undefined ||
        mpToken === undefined ||
        valor === undefined
    ) {
      return res.status(400).json({
        error: 'Bad Request: Missing required fields',
        status: 400
      })
    }

    try {
      const date = new Date()
      date.setDate(date.getDate() + 1)
      const isoDate = date.toISOString()

      const client = new MercadoPagoConfig({ accessToken: mpToken })
      const paymentData = await new Payment(client).create({
        body: {
          payer: {
            first_name: userName,
            last_name: userId,
            email: `${userId}@gmail.com`
          },
          description: `Pagamento Via Discord | ${userName} | R$${(valor).toFixed(2)}`,
          transaction_amount: Math.round(valor),
          payment_method_id: 'pix',
          installments: 0
        }
      })

      const dateStr = paymentData?.date_of_expiration ?? isoDate
      const expirationDate = new Date(dateStr)
      expirationDate.setMinutes(expirationDate.getMinutes())
      const unixTimestamp = Math.floor(expirationDate.getTime() / 1000)

      return res.status(200).json({ unixTimestamp, paymentData })
    } catch (err) {
      console.log(err)
      res.status(500).json({
        code: 500,
        message: 'Houve um erro na solicitação.'
      })
    }
  }
}

export const Root = new CreatePixPayment()
