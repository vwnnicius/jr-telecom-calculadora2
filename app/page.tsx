"use client"

import { useState, useEffect } from "react"
import { planData, equipmentData } from "@/lib/data"
import type { JSX } from "react" // Declare JSX variable

type ActiveTab = "limpeza" | "multa"
type CalcMethod = "num" | "ref"

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("limpeza")
  const [showResults, setShowResults] = useState(false)
  const [resultContent, setResultContent] = useState<JSX.Element | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Limpeza states
  const [limpezaPlano, setLimpezaPlano] = useState("")
  const [limpezaBoleto1Venc, setLimpezaBoleto1Venc] = useState("")
  const [limpezaBoleto1ValorOpcional, setLimpezaBoleto1ValorOpcional] = useState("")
  const [limpezaBoleto2Venc, setLimpezaBoleto2Venc] = useState("")
  const [limpezaDiasProporcionais, setLimpezaDiasProporcionais] = useState("")

  // Multa states
  const [semMulta, setSemMulta] = useState(false)
  const [isNewPlan, setIsNewPlan] = useState(false)
  const [calcMethod, setCalcMethod] = useState<CalcMethod>("num")
  const [boletosPagos, setBoletosPagos] = useState("")
  const [multaBoleto1Ref, setMultaBoleto1Ref] = useState("")
  const [multaBoleto2Ref, setMultaBoleto2Ref] = useState("")
  const [totalBoletosRef, setTotalBoletosRef] = useState("")
  const [routerSelect, setRouterSelect] = useState("0")
  const [onuSelect, setOnuSelect] = useState("0")

  // Auto-fill boleto 2 date when boleto 1 changes
  useEffect(() => {
    if (limpezaBoleto1Venc) {
      const date = new Date(limpezaBoleto1Venc + "T12:00:00Z")
      date.setUTCMonth(date.getUTCMonth() + 1)

      const nextYear = date.getUTCFullYear()
      const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0")

      const originalDay = Number.parseInt(limpezaBoleto1Venc.split("-")[2], 10)
      const lastDayOfNextMonth = new Date(nextYear, Number.parseInt(nextMonth, 10), 0).getDate()

      const finalDay = String(Math.min(originalDay, lastDayOfNextMonth)).padStart(2, "0")
      const nextDate = `${nextYear}-${nextMonth}-${finalDay}`

      setLimpezaBoleto2Venc(nextDate)
    }
  }, [limpezaBoleto1Venc])

  // Auto-fill multa boleto 2 ref when boleto 1 ref changes
  useEffect(() => {
    if (multaBoleto1Ref) {
      const [year, month] = multaBoleto1Ref.split("-").map(Number)
      let nextMonth = month + 1
      let nextYear = year

      if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }

      const nextMonthStr = String(nextMonth).padStart(2, "0")
      const nextRef = `${nextYear}-${nextMonthStr}`

      setMultaBoleto2Ref(nextRef)
    }
  }, [multaBoleto1Ref])

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    setShowResults(false)
    setResultContent(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const calculateLimpeza = async () => {
    if (!limpezaPlano || !limpezaBoleto1Venc || !limpezaBoleto2Venc || !limpezaDiasProporcionais) {
      alert("Por favor, preencha todos os campos obrigatórios da Calculadora de Limpeza.")
      return
    }

    setIsCalculating(true)

    try {
      const response = await fetch("/api/calculate-limpeza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: limpezaPlano,
          vencimento1: limpezaBoleto1Venc,
          valorBoleto1Opcional: limpezaBoleto1ValorOpcional ? Number.parseFloat(limpezaBoleto1ValorOpcional) : null,
          vencimento2: limpezaBoleto2Venc,
          diasProporcionais2: Number.parseInt(limpezaDiasProporcionais),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Erro ao calcular.")
        return
      }

      const { boleto1, boleto2, valorFinal, colinha } = data

      setResultContent(
        <div>
          <div className="result-card p-4 rounded-lg border border-gray-200 bg-white">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalhes do Cálculo de Limpeza</h3>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-600">Boleto 1:</p>
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-500">Principal:</span>
                <span className="font-medium text-gray-700">R$ {boleto1.principalA.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-500">Multa (2%):</span>
                <span className="font-medium text-gray-700">R$ {boleto1.multaB.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-500">Juros (1% a.m.):</span>
                <span className="font-medium text-gray-700">R$ {boleto1.jurosD.toFixed(2)}</span>
              </div>
              <p className="font-semibold text-gray-600 mt-2">Boleto 2:</p>
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-500">Principal (Proporcional):</span>
                <span className="font-medium text-gray-700">R$ {boleto2.principalE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-500">Multa (2%):</span>
                <span className="font-medium text-gray-700">R$ {boleto2.multaF.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-500">Juros (1% a.m.):</span>
                <span className="font-medium text-gray-700">R$ {boleto2.jurosH.toFixed(2)}</span>
              </div>
              <hr className="my-2 border-gray-300" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-[var(--primary-color)]">Total com Juros:</span>
                <span className="font-extrabold text-[var(--primary-color)]">R$ {valorFinal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="copy-box mt-4 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-800">Descrição da O.S:</h4>
              <button
                onClick={() => copyToClipboard(colinha)}
                className="text-gray-500 hover:text-[var(--primary-color)] transition"
              >
                <i className="fas fa-copy mr-1"></i> Copiar
              </button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{colinha}</p>
          </div>
        </div>,
      )

      setShowResults(true)
    } catch (error) {
      console.error("[v0] Error calculating limpeza:", error)
      alert("Erro ao processar o cálculo.")
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateMulta = async () => {
    const method = calcMethod
    let boletos = 0

    if (!semMulta) {
      if (method === "num") {
        boletos = Number.parseInt(boletosPagos)
        if (isNaN(boletos) || boletos < 0 || boletos > 11) {
          alert("Por favor, insira um número de boletos entre 0 e 11.")
          return
        }
      } else {
        boletos = Number.parseInt(totalBoletosRef)
        if (isNaN(boletos) || boletos < 0 || boletos > 11) {
          alert("Por favor, insira o Nº Total de Boletos (entre 0 e 11) no campo de Referência.")
          return
        }
      }
    }

    setIsCalculating(true)

    try {
      const routerCost = Number.parseFloat(routerSelect)
      const onuCost = Number.parseFloat(onuSelect)
      const routerName = equipmentData.routers.find((r) => r.price === routerCost)?.name || "Nenhum"
      const onuName = equipmentData.onus.find((o) => o.price === onuCost)?.name || "Nenhum"

      const response = await fetch("/api/calculate-multa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          semMulta,
          boletosPagos: boletos,
          isNewPlan,
          routerCost,
          routerName,
          onuCost,
          onuName,
          boleto1Ref: multaBoleto1Ref,
          boleto2Ref: multaBoleto2Ref,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Erro ao calcular.")
        return
      }

      const { totalFine, proportionalFine, newPlanFine, totalDebit, colinha } = data

      let fineDetailsHtml = null
      if (!semMulta) {
        fineDetailsHtml = (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Multa Proporcional (Fidelidade):</span>
              <span className="font-semibold text-gray-800">R$ {proportionalFine.toFixed(2)}</span>
            </div>
            {newPlanFine > 0 && (
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-500 text-xs">Adicional (Novos Planos):</span>
                <span className="font-semibold text-gray-600 text-xs">R$ {newPlanFine.toFixed(2)}</span>
              </div>
            )}
          </>
        )
      }

      setResultContent(
        <div>
          <div className="result-card p-4 rounded-lg border border-gray-200 bg-white">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalhes do Débito</h3>
            <div className="space-y-2 text-sm">
              {fineDetailsHtml}
              {routerCost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Débito {data.routerName}:</span>
                  <span className="font-semibold text-gray-800">R$ {routerCost.toFixed(2)}</span>
                </div>
              )}
              {onuCost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Débito {data.onuName}:</span>
                  <span className="font-semibold text-gray-800">R$ {onuCost.toFixed(2)}</span>
                </div>
              )}
              <hr className="my-2 border-gray-300" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-[var(--primary-color)]">Valor Total do Débito:</span>
                <span className="font-extrabold text-[var(--primary-color)]">R$ {totalDebit.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="copy-box mt-4 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-800">Colinha para Alerta:</h4>
              <button
                onClick={() => copyToClipboard(colinha)}
                className="text-gray-500 hover:text-[var(--primary-color)] transition"
              >
                <i className="fas fa-copy mr-1"></i> Copiar
              </button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{colinha}</p>
          </div>
        </div>,
      )

      setShowResults(true)
    } catch (error) {
      console.error("[v0] Error calculating multa:", error)
      alert("Erro ao processar o cálculo.")
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-center mb-6">
          <img src="https://i.imgur.com/5KGDldA.png" alt="Logo JR Telecom" className="h-12" />
        </div>

        <div className="main-card grid grid-cols-1 lg:grid-cols-5 gap-8 p-8 rounded-2xl">
          {/* Calculator Column */}
          <div className="calculator-column lg:col-span-3">
            {/* Tabs */}
            <div className="flex border-b border-border mb-6">
              <button
                onClick={() => switchTab("limpeza")}
                className={`tab-button flex-1 py-2 px-4 rounded-t-lg text-sm font-bold ${activeTab === "limpeza" ? "active" : ""}`}
              >
                <i className="fas fa-broom mr-2"></i>Calculadora de Limpeza
              </button>
              <button
                onClick={() => switchTab("multa")}
                className={`tab-button flex-1 py-2 px-4 rounded-t-lg text-sm font-bold ${activeTab === "multa" ? "active" : ""}`}
              >
                <i className="fas fa-file-invoice-dollar mr-2"></i>Calculadora de Multa
              </button>
            </div>

            {/* Limpeza Content */}
            {activeTab === "limpeza" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Cálculo de Limpeza</h1>
                <p className="text-muted-foreground mb-6">Calcule débitos replicando a lógica do TopSapp.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Plano do Cliente
                      <span className="tooltip-icon" title="Selecione o plano de internet que o cliente contratou.">
                        <i className="fas fa-question"></i>
                      </span>
                    </label>
                    <select
                      value={limpezaPlano}
                      onChange={(e) => setLimpezaPlano(e.target.value)}
                      className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                    >
                      <option value="">Selecione um plano</option>
                      {planData.map((plan) => (
                        <option key={plan.name} value={plan.name}>
                          {plan.name} - R$ {plan.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 border-t border-border pt-4 mt-2">
                    <p className="font-semibold text-card-foreground">Boleto 1 (O mais antigo)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                          Data de Vencimento
                          <span
                            className="tooltip-icon"
                            title="Insira a data de vencimento original do boleto mais antigo que está em aberto."
                          >
                            <i className="fas fa-question"></i>
                          </span>
                        </label>
                        <input
                          type="date"
                          value={limpezaBoleto1Venc}
                          onChange={(e) => setLimpezaBoleto1Venc(e.target.value)}
                          className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                          Valor do Boleto 1 (Opcional)
                          <span
                            className="tooltip-icon"
                            title="Preencha apenas se o boleto 1 não for o valor cheio do plano (ex: um valor proporcional ou de negociação). Caso contrário, deixe em branco."
                          >
                            <i className="fas fa-question"></i>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={limpezaBoleto1ValorOpcional}
                          onChange={(e) => setLimpezaBoleto1ValorOpcional(e.target.value)}
                          className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                          placeholder="Deixe em branco se for o valor integral"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 border-t border-border pt-4 mt-2">
                    <p className="font-semibold text-card-foreground">Boleto 2 (Proporcional)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                          Data de Vencimento
                          <span
                            className="tooltip-icon"
                            title="Insira a data de vencimento do segundo boleto (geralmente proporcional). Este campo é preenchido automaticamente ao inserir a data do Boleto 1."
                          >
                            <i className="fas fa-question"></i>
                          </span>
                        </label>
                        <input
                          type="date"
                          value={limpezaBoleto2Venc}
                          onChange={(e) => setLimpezaBoleto2Venc(e.target.value)}
                          className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                          Dias Proporcionais
                          <span
                            className="tooltip-icon"
                            title="Informe o número de dias de serviço prestado que devem ser cobrados neste boleto (geralmente 17 ou 18 dias)."
                          >
                            <i className="fas fa-question"></i>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={limpezaDiasProporcionais}
                          onChange={(e) => setLimpezaDiasProporcionais(e.target.value)}
                          min="1"
                          max="30"
                          className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                          placeholder="Ex: 18"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={calculateLimpeza}
                  disabled={isCalculating}
                  className="w-full mt-8 btn btn-calculate text-primary-foreground font-bold py-3 rounded-lg text-lg disabled:opacity-50"
                >
                  <i className="fas fa-calculator mr-2"></i>
                  {isCalculating ? "Calculando..." : "Calcular Limpeza"}
                </button>
              </div>
            )}

            {/* Multa Content */}
            {activeTab === "multa" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Cálculo de Multa Rescisória</h1>
                <p className="text-muted-foreground mb-6">Escolha um método e preencha os campos.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="sm:col-span-2 flex items-center space-x-8">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sem-multa"
                        checked={semMulta}
                        onChange={(e) => setSemMulta(e.target.checked)}
                        className="h-5 w-5 rounded border-input"
                      />
                      <label htmlFor="sem-multa" className="ml-2 block text-sm font-medium text-foreground">
                        Sem Multa
                        <span
                          className="tooltip-icon"
                          title="Marque esta opção se o cliente for isento da multa por quebra de fidelidade. O cálculo considerará apenas débitos de equipamentos."
                        >
                          <i className="fas fa-question"></i>
                        </span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is-new-plan"
                        checked={isNewPlan}
                        onChange={(e) => setIsNewPlan(e.target.checked)}
                        disabled={semMulta}
                        className="h-5 w-5 rounded border-input"
                      />
                      <label htmlFor="is-new-plan" className="ml-2 block text-sm font-medium text-foreground">
                        Contrato ≥ 2022
                        <span
                          className="tooltip-icon"
                          title="Marque esta opção se o contrato de fidelidade do cliente foi assinado a partir de 2022, para aplicar a tabela de 'Novos Planos'."
                        >
                          <i className="fas fa-question"></i>
                        </span>
                      </label>
                    </div>
                  </div>

                  {!semMulta && (
                    <div className="sm:col-span-2 flex justify-around bg-muted p-1 rounded-lg">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="calc-method-num"
                          name="calc-method"
                          value="num"
                          checked={calcMethod === "num"}
                          onChange={() => setCalcMethod("num")}
                          className="h-4 w-4"
                        />
                        <label htmlFor="calc-method-num" className="ml-2 text-sm font-medium text-muted-foreground">
                          Por Nº de Boletos
                          <span
                            className="tooltip-icon"
                            title="Calcule a multa com base no número total de boletos que foram pagos e que já venceram."
                          >
                            <i className="fas fa-question"></i>
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="calc-method-ref"
                          name="calc-method"
                          value="ref"
                          checked={calcMethod === "ref"}
                          onChange={() => setCalcMethod("ref")}
                          className="h-4 w-4"
                        />
                        <label htmlFor="calc-method-ref" className="ml-2 text-sm font-medium text-muted-foreground">
                          Por Referência
                          <span
                            className="tooltip-icon"
                            title="Use este método para identificar os boletos em aberto pela sua data de referência (mês/ano)."
                          >
                            <i className="fas fa-question"></i>
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {!semMulta && calcMethod === "num" && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-card-foreground mb-1">
                        Nº de Boletos Pagos/Vencidos
                        <span
                          className="tooltip-icon"
                          title="Digite a quantidade total de mensalidades que o cliente pagou e que já venceram (de 0 a 11)."
                        >
                          <i className="fas fa-question"></i>
                        </span>
                      </label>
                      <input
                        type="number"
                        value={boletosPagos}
                        onChange={(e) => setBoletosPagos(e.target.value)}
                        min="0"
                        max="11"
                        className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                        placeholder="Ex: 6"
                      />
                    </div>
                  )}

                  {(semMulta || calcMethod === "ref") && (
                    <div className="sm:col-span-2 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <label className="block text-sm font-medium text-card-foreground">
                            Referência Boleto 1 Vencido
                            <span
                              className="tooltip-icon"
                              title="Selecione o mês e o ano de referência do primeiro boleto em aberto."
                            >
                              <i className="fas fa-question"></i>
                            </span>
                          </label>
                          <input
                            type="month"
                            value={multaBoleto1Ref}
                            onChange={(e) => setMultaBoleto1Ref(e.target.value)}
                            className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-card-foreground">
                            Referência Boleto 2 Vencido
                            <span
                              className="tooltip-icon"
                              title="Este campo é preenchido automaticamente ao selecionar a referência do Boleto 1."
                            >
                              <i className="fas fa-question"></i>
                            </span>
                          </label>
                          <input
                            type="month"
                            value={multaBoleto2Ref}
                            onChange={(e) => setMultaBoleto2Ref(e.target.value)}
                            className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                          />
                        </div>
                      </div>
                      {!semMulta && (
                        <div>
                          <label className="block text-sm font-medium text-card-foreground">
                            Nº Total de Boletos (Pagos + Vencidos)
                            <span
                              className="tooltip-icon"
                              title="Digite a quantidade total de mensalidades que o cliente pagou ou que já venceram (de 0 a 11)."
                            >
                              <i className="fas fa-question"></i>
                            </span>
                          </label>
                          <input
                            type="number"
                            value={totalBoletosRef}
                            onChange={(e) => setTotalBoletosRef(e.target.value)}
                            className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                            placeholder="Ex: 6"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="sm:col-span-2 border-t border-border pt-4 mt-2">
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">Equipamentos em Débito</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                          📶 Roteadores
                          <span
                            className="tooltip-icon"
                            title="Selecione o modelo do roteador que não foi devolvido ou foi danificado para incluir o valor no débito total. (Confirme essa informação na O.S ou Histórico do cadastro)"
                          >
                            <i className="fas fa-question"></i>
                          </span>
                        </label>
                        <select
                          value={routerSelect}
                          onChange={(e) => setRouterSelect(e.target.value)}
                          className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                        >
                          <option value="0">Nenhum</option>
                          {equipmentData.routers.map((router) => (
                            <option key={router.name} value={router.price}>
                              {router.name} - R$ {router.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">
                          🔌 ONUs
                          <span
                            className="tooltip-icon"
                            title="Selecione o modelo da ONU que não foi devolvido ou foi danificado para incluir o valor no débito total. (Confirme essa informação na O.S ou Histórico do cadastro)"
                          >
                            <i className="fas fa-question"></i>
                          </span>
                        </label>
                        <select
                          value={onuSelect}
                          onChange={(e) => setOnuSelect(e.target.value)}
                          className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground"
                        >
                          <option value="0">Nenhum</option>
                          {equipmentData.onus.map((onu) => (
                            <option key={onu.name} value={onu.price}>
                              {onu.name} - R$ {onu.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={calculateMulta}
                  disabled={isCalculating}
                  className="w-full mt-8 btn btn-calculate text-primary-foreground font-bold py-3 rounded-lg text-lg disabled:opacity-50"
                >
                  <i className="fas fa-calculator mr-2"></i>
                  {isCalculating ? "Calculando..." : "Calcular Débito Total"}
                </button>
                <div className="warning-box mt-8 p-4 rounded-lg flex items-start">
                  <i className="fas fa-exclamation-triangle text-xl mr-4 mt-1 text-destructive"></i>
                  <div>
                    <h3 className="font-bold text-destructive warning-text-blink">ATENÇÃO - ANÁLISE OBRIGATÓRIA</h3>
                    <p className="text-sm text-card-foreground">
                      PARA NEGATIVAR É OBRIGATÓRIO QUE VOCÊ ANALISE AS ASSINATURAS E OS CONTRATOS.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Column */}
          <div className="ai-column lg:col-span-2 bg-muted p-6 rounded-lg border border-border">
            <div className="flex items-center mb-4">
              <i className="fas fa-poll-h text-2xl text-primary mr-3"></i>
              <div>
                <h2 className="text-xl font-bold text-foreground">Painel de Resultados</h2>
                <p className="text-sm text-muted-foreground">Resultados e ações geradas pela calculadora.</p>
              </div>
            </div>

            {showResults ? (
              <div>{resultContent}</div>
            ) : (
              <div className="text-center text-muted-foreground p-8">
                <i className="fas fa-hand-sparkles text-4xl mb-4 text-muted-foreground/60"></i>
                <p>Após o cálculo, os resultados aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="text-center mt-8">
          <div className="inline-block bg-card px-4 py-2 rounded-lg shadow-md">
            <p className="text-xs font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Criado por Vinícius B. - Financeiro JR TELECOM.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
