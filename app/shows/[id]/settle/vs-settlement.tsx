import { Card, CardContent, CardHeader, CardTitle, CardDescription, Field } from "@/components/ui/card";
import { PlainBadge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import type { Expense } from "@/db/schema";
import { calculateVsSettlement } from "@/lib/dealMath";

export type VsSettlementOutput = ReturnType<typeof calculateVsSettlement>;

export function VsSettlement({
  vsCalc,
  expenses,
  dealNotesFreetext,
}: {
  vsCalc: VsSettlementOutput;
  expenses: Expense[];
  dealNotesFreetext?: string | null;
}) {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const overCap = vsCalc.expenseCap != null && totalExpenses > vsCalc.expenseCap;
  const hasWalkout = !!vsCalc.walkoutBonus;
  const additiveTotal = vsCalc.basePayout + vsCalc.walkoutAmount;
  const replacementTotal = vsCalc.walkoutAmount;

  return (
    <div className="space-y-6">
      {vsCalc.walkoutAmbiguous && (
        <Card accent="amber">
          <CardContent>
            <div className="text-left">
              <div className="text-[13px] font-semibold text-amber-900 mb-2">
                Deal language is ambiguous — confirm walkout interpretation with agent before finalizing.
              </div>
              <div className="text-[13px] text-ink-600">
                Do not pay from a single total until confirmed.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>TOTAL TO ARTIST</CardTitle>
            <CardDescription>
              The amount the venue is planning to pay once the payout path is confirmed.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[12px] text-ink-500 uppercase tracking-[0.2em] mb-2">
                Total to artist
              </div>
              {vsCalc.walkoutAmbiguous ? (
                <div className="text-[24px] font-semibold text-ink-900 font-mono tabular">
                  PENDING CONFIRMATION
                </div>
              ) : (
                <div className="text-[32px] font-semibold text-ink-900 font-mono tabular">
                  {formatMoney(vsCalc.basePayout)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>BOX OFFICE</CardTitle>
            <CardDescription>Gross, fees, and net available for this show.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Gross box office" value={formatMoney(vsCalc.grossBoxOffice)} />
          <Field label="Fees" value={formatMoney(-vsCalc.fees)} />
          <Field label="Net box office" value={formatMoney(vsCalc.net)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>EXPENSES</CardTitle>
            <CardDescription>
              What passes through to the artist payout, and how the cap affects the calculation.
            </CardDescription>
          </div>
          {overCap ? <PlainBadge variant="rose">Over cap</PlainBadge> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[13px] text-ink-900 font-medium capitalize">
                    {expense.category.replace(/_/g, " ")}
                  </div>
                  {expense.description ? (
                    <div className="text-[12px] text-ink-500">{expense.description}</div>
                  ) : null}
                </div>
                <div className="font-mono tabular text-ink-900">
                  {formatMoney(expense.amount)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-ink-100/80 pt-4 space-y-2">
            <div className="flex items-center justify-between text-[13px] text-ink-600">
              <span>Total passed through</span>
              <span className="font-mono tabular text-ink-900">{formatMoney(totalExpenses)}</span>
            </div>
            <div className="flex items-center justify-between text-[13px] text-ink-600">
              <span>Amount used in calc</span>
              <span className="font-mono tabular text-ink-900">{formatMoney(vsCalc.cappedExpenses)}</span>
            </div>
            <div className="flex items-center justify-between text-[13px] text-ink-600">
              <span>Net after expenses</span>
              <span className="font-mono tabular text-ink-900">{formatMoney(vsCalc.netAfterExpenses)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>VS COMPARISON</CardTitle>
            <CardDescription>
              Compare the guarantee and percentage payout so the winning path is clear.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-ink-200/80 bg-ink-50 p-4">
              <div className="text-[12px] text-ink-500 uppercase tracking-[0.18em] mb-2">
                Percentage payout
              </div>
              <div className="text-[24px] font-semibold text-ink-900 font-mono tabular mb-2">
                {formatMoney(vsCalc.percentagePayout)}
              </div>
              <div className="text-[12px] text-ink-500">
                {formatMoney(vsCalc.netAfterExpenses)} × {Math.round(vsCalc.percentage * 100)}%
              </div>
            </div>

            <div className="rounded-xl border border-ink-200/80 bg-ink-50 p-4">
              <div className="text-[12px] text-ink-500 uppercase tracking-[0.18em] mb-2">
                Guarantee
              </div>
              <div className="text-[24px] font-semibold text-ink-900 font-mono tabular">
                {formatMoney(vsCalc.guarantee)}
              </div>
            </div>
          </div>

          <div className="mt-4 text-[13px] text-ink-600">
            {vsCalc.basePayout === vsCalc.percentagePayout ? (
              `Percentage payout and guarantee are equal — artist gets ${formatMoney(vsCalc.basePayout)}.`
            ) : vsCalc.basePayout === vsCalc.guarantee ? (
              `Guarantee beats percentage payout — artist gets ${formatMoney(vsCalc.basePayout)}.`
            ) : (
              `Percentage payout beats guarantee — artist gets ${formatMoney(vsCalc.basePayout)}.`
            )}
          </div>
        </CardContent>
      </Card>

      {hasWalkout && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>WALKOUT POT</CardTitle>
              <CardDescription>
                The extra amount earned on gross above the walkout threshold.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Threshold"
                value={formatMoney(vsCalc.walkoutThreshold ?? 0)}
              />
              <Field
                label="Gross above threshold"
                value={formatMoney(vsCalc.grossAboveThreshold)}
              />
              <Field label="Walkout amount" value={formatMoney(vsCalc.walkoutAmount)} />
            </div>
            {vsCalc.walkoutAmbiguous && (
              <div className="rounded-lg border border-amber-200/80 bg-amber-50 p-4 text-[13px] text-amber-900">
                <div className="font-semibold mb-2">Ambiguous walkout interpretation</div>
                <div className="space-y-1">
                  <div>If additive: {formatMoney(additiveTotal)}</div>
                  <div>If replaces base: {formatMoney(replacementTotal)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>SETTLEMENT TRACE</CardTitle>
            <CardDescription>Every line of math is shown so the total is transparent.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-ink-100/80">
          <div className="py-3 flex items-center justify-between text-[13px] text-ink-600">
            <span>Gross box office</span>
            <span className="font-mono tabular text-ink-900">{formatMoney(vsCalc.grossBoxOffice)}</span>
          </div>
          <div className="py-3 flex items-center justify-between text-[13px] text-ink-600">
            <span>Less fees</span>
            <span className="font-mono tabular text-ink-900">{formatMoney(-vsCalc.fees)}</span>
          </div>
          <div className="py-3 flex items-center justify-between text-[13px] text-ink-600">
            <span>Net box office</span>
            <span className="font-mono tabular text-ink-900">{formatMoney(vsCalc.net)}</span>
          </div>
          <div className="py-3 flex items-center justify-between text-[13px] text-ink-600">
            <span>Total expenses</span>
            <span className="font-mono tabular text-ink-900">{formatMoney(totalExpenses)}</span>
          </div>
          <div className="py-3 flex items-center justify-between text-[13px] text-ink-600">
            <span>Expenses used in calc</span>
            <span className="font-mono tabular text-ink-900">{formatMoney(vsCalc.cappedExpenses)}</span>
          </div>
          <div className="py-3 flex items-center justify-between text-[13px] text-ink-600">
            <span>Net after expenses</span>
            <span className="font-mono tabular text-ink-900">{formatMoney(vsCalc.netAfterExpenses)}</span>
          </div>
          <div className="py-3 flex items-center justify-between text-[13px] text-ink-600">
            <span>Percentage payout</span>
            <span className="font-mono tabular text-ink-900">{formatMoney(vsCalc.percentagePayout)}</span>
          </div>
          <div className="py-3 flex items-center justify-between text-[13px] text-ink-600">
            <span>Guarantee</span>
            <span className="font-mono tabular text-ink-900">{formatMoney(vsCalc.guarantee)}</span>
          </div>
          <div className="py-3 flex items-center justify-between text-[13px] font-semibold text-ink-900">
            <span>Base payout</span>
            <span className="font-mono tabular">{formatMoney(vsCalc.basePayout)}</span>
          </div>
          {hasWalkout && (
            <div className="py-3 flex items-center justify-between text-[13px] text-ink-600">
              <span>Walkout amount</span>
              <span className="font-mono tabular text-ink-900">{formatMoney(vsCalc.walkoutAmount)}</span>
            </div>
          )}
        </CardContent>
        <div className="px-5 pb-4 text-[12px] text-ink-500">
          Every line adds to the total.
        </div>
      </Card>

      {dealNotesFreetext ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>What Mariana actually trusts</CardTitle>
              <CardDescription>
                Raw deal notes from the contract and the booking conversation.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-[13px] text-ink-800 bg-canvas-soft rounded-lg p-4 ring-1 ring-ink-200/60 whitespace-pre-line">
              {dealNotesFreetext}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
