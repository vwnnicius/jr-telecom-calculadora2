import { type NextRequest, NextResponse } from "next/server"
import { fineTable } from "@/lib/data"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      method,
      semMulta,
      boletosPagos,
      isNewPlan,
      routerCost,
      routerName,
      onuCost,
      onuName,
      boleto1Ref,
      boleto2Ref,
    } = body

    // Validação
    if (!method) {
      return NextResponse.json({ error: "Método de cálculo não especificado." }, { status: 400 })
    }

    if (!semMulta && (boletosPagos === undefined || boletosPagos < 0 || boletosPagos > 11)) {
      return NextResponse.json({ error: "Número de boletos inválido." }, { status: 400 })
    }

    let proportionalFine = 0
    let newPlanFine = 0
    let totalFine = 0

    if (!semMulta) {
      const fineData = fineTable.find((item) => item.boletos === boletosPagos)

      if (!fineData) {
        return NextResponse.json(
          { error: `Dados de multa não encontrados para ${boletosPagos} boletos.` },
          { status: 400 },
        )
      }

      proportionalFine = fineData.fibra
      newPlanFine = isNewPlan ? fineData.novosPlanos : 0
      totalFine = proportionalFine + newPlanFine
    }

    const totalEquipmentCost = routerCost + onuCost
    const totalDebit = totalFine + totalEquipmentCost

    // Gerar colinha
    let colinha = "Nenhuma pendência para alerta."
    const colinhaParts: string[] = []

    if (method === "ref" && boleto1Ref && boleto2Ref) {
      const [ano1, mes1] = boleto1Ref.split("-")
      const [ano2, mes2] = boleto2Ref.split("-")
      colinhaParts.push(`Pendência ref. ${mes1}/${ano1} e ${mes2}/${ano2}`)
    }

    if (semMulta) {
      colinhaParts.push("Sem Multa")
    } else {
      if (proportionalFine > 0) {
        colinhaParts.push(`Multa R$${proportionalFine.toFixed(2).replace(".", ",")}`)
      }
      if (newPlanFine > 0) {
        colinhaParts.push(`Multa novos planos R$${newPlanFine.toFixed(2).replace(".", ",")}`)
      }
    }

    if (onuCost > 0) {
      colinhaParts.push(`ONU R$${onuCost.toFixed(2).replace(".", ",")}`)
    }
    if (routerCost > 0) {
      colinhaParts.push(`ROTEADOR R$${routerCost.toFixed(2).replace(".", ",")}`)
    }

    if (colinhaParts.length > 0) {
      colinha = colinhaParts.join(" - ") + "\nPASSADO PARA A NEGATIVAÇÃO."
    }

    return NextResponse.json({
      totalFine,
      proportionalFine,
      newPlanFine,
      totalEquipmentCost,
      routerCost,
      routerName,
      onuCost,
      onuName,
      totalDebit,
      colinha,
      method,
      semMulta,
    })
  } catch (error) {
    console.error("[v0] Error in calculate-multa:", error)
    return NextResponse.json({ error: "Erro ao processar o cálculo." }, { status: 500 })
  }
}
