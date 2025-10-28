import { type NextRequest, NextResponse } from "next/server"
import { planData } from "@/lib/data"

function calculateOverdueDays(dueDateStr: string, calcDate: Date): number {
  if (!dueDateStr) return 0
  const dueDate = new Date(dueDateStr + "T12:00:00Z")
  const timeDiff = calcDate.getTime() - dueDate.getTime()
  const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24))
  return dayDiff > 0 ? dayDiff : 0
}

function trunc(value: number, decimals: number): number {
  return Math.trunc(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planName, vencimento1, valorBoleto1Opcional, vencimento2, diasProporcionais2 } = body

    // Validação
    if (!planName || !vencimento1 || !vencimento2 || !diasProporcionais2) {
      return NextResponse.json({ error: "Todos os campos obrigatórios devem ser preenchidos." }, { status: 400 })
    }

    // Encontrar o plano
    const plan = planData.find((p) => p.name === planName)
    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado." }, { status: 400 })
    }

    const valorPlano = plan.price
    const dataCalculo = new Date()

    // Cálculo Boleto 1
    const principalA = valorBoleto1Opcional && valorBoleto1Opcional > 0 ? valorBoleto1Opcional : valorPlano
    const multaB = trunc(principalA * 0.02, 2)
    const diasAtrasoC = calculateOverdueDays(vencimento1, dataCalculo)
    const jurosD = principalA * (0.01 / 30) * diasAtrasoC
    const totalBoleto1 = principalA + multaB + jurosD

    // Cálculo Boleto 2
    const principalE = (valorPlano / 30) * diasProporcionais2
    const multaF = trunc(principalE * 0.02, 2)
    const diasAtrasoG = calculateOverdueDays(vencimento2, dataCalculo)
    const jurosH = principalE * (0.01 / 30) * diasAtrasoG
    const totalBoleto2 = principalE + multaF + jurosH

    const valorFinal = totalBoleto1 + totalBoleto2
    const valorPrincipalTotal = principalA + principalE

    // Gerar referências
    const dataVenc1 = new Date(vencimento1 + "T12:00:00Z")
    const mes1 = (dataVenc1.getUTCMonth() + 1).toString().padStart(2, "0")
    const ano1 = dataVenc1.getUTCFullYear()
    const mesRef1 = `${mes1}/${ano1}`

    const dataVenc2 = new Date(vencimento2 + "T12:00:00Z")
    const mes2 = (dataVenc2.getUTCMonth() + 1).toString().padStart(2, "0")
    const ano2 = dataVenc2.getUTCFullYear()
    const mesRef2 = `${mes2}/${ano2}`

    const parcelasTexto = valorFinal < 100 ? "em até 1x no cartão de crédito" : "em até 2x no cartão de crédito"
    const referenciaTexto = `Referente aos meses ${mesRef1} e proporcional de ${diasProporcionais2} dias do mês ${mesRef2}.`
    const colinha = `Mensalidade e proporcional com juros: R$${valorFinal.toFixed(2).replace(".", ",")} ${parcelasTexto}\nMensalidade e proporcional sem juros: R$${valorPrincipalTotal.toFixed(2).replace(".", ",")} no cartão débito, ou em dinheiro.\n${referenciaTexto}`

    return NextResponse.json({
      boleto1: {
        principalA,
        multaB,
        jurosD,
        totalBoleto1,
      },
      boleto2: {
        principalE,
        multaF,
        jurosH,
        totalBoleto2,
      },
      valorFinal,
      colinha,
    })
  } catch (error) {
    console.error("[v0] Error in calculate-limpeza:", error)
    return NextResponse.json({ error: "Erro ao processar o cálculo." }, { status: 500 })
  }
}
