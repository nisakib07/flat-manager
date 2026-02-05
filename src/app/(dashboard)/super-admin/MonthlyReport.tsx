import React, { useMemo } from 'react'

interface MonthlyReportProps {
  monthLabel: string
  data: {
    users: any[]
    mealCosts: any[]
    bajarItems: any[]
    commonExpenses: any[]
    mealDeposits: any[]
    dailyMeals: any[]
    utilityCollections: any[]
    utilityExpenses: any[]
  }
}

export const MonthlyReport = React.forwardRef<HTMLDivElement, MonthlyReportProps>(({ monthLabel, data }, ref) => {
  const { users, mealCosts, bajarItems, commonExpenses, mealDeposits, dailyMeals, utilityCollections, utilityExpenses } = data

  // --- Main Calculation Logic ---
  const { totalBajar, totalMealWeight, mealRate } = useMemo(() => {
    const totalBajar = bajarItems?.reduce((sum, item) => sum + Number(item.cost), 0) || 0
    const totalMealWeight = mealCosts?.reduce((sum, meal) => sum + Number(meal.meal_weight), 0) || 0
    const mealRate = totalMealWeight > 0 ? totalBajar / totalMealWeight : 0
    
    return { totalBajar, totalMealWeight, mealRate }
  }, [bajarItems, mealCosts])

  const userSummaries = useMemo(() => {
    if (!users) return []
    const summaries = users.map(user => {
      const userMeals = mealCosts?.filter(m => m.user_id === user.id) || []
      const totalWeight = userMeals.reduce((sum, m) => sum + Number(m.meal_weight), 0)
      const mealCount = userMeals.length
      const cost = mealRate * totalWeight
      
      const userDepositRecord = mealDeposits?.find(d => d.user_id === user.id)
      const totalRawDeposit = userDepositRecord ? (
        (Number(userDepositRecord.d1) || 0) + 
        (Number(userDepositRecord.d2) || 0) + 
        (Number(userDepositRecord.d3) || 0) + 
        (Number(userDepositRecord.d4) || 0) + 
        (Number(userDepositRecord.d5) || 0) + 
        (Number(userDepositRecord.d6) || 0) + 
        (Number(userDepositRecord.d7) || 0) + 
        (Number(userDepositRecord.d8) || 0) + 
        (Number(userDepositRecord.carry_forward) || 0)
      ) : 0

      const totalCommonExpenseShare = commonExpenses?.reduce((sum, expense) => sum + Number(expense.user_share), 0) || 0

      const netDeposit = totalRawDeposit - totalCommonExpenseShare
      const balance = netDeposit - cost

      return {
        userId: user.id,
        name: user.name,
        totalWeight,
        mealCount,
        cost,
        deposit: netDeposit,
        rawDeposit: totalRawDeposit,
        commonExpense: totalCommonExpenseShare,
        balance,
        depositRecord: userDepositRecord
      }
    })

    return summaries.sort((a, b) => a.name.localeCompare(b.name))
  }, [users, mealCosts, mealRate, mealDeposits, commonExpenses])

  const totalDepositSum = userSummaries.reduce((sum, u) => sum + u.deposit, 0)
  const totalBalanceSum = userSummaries.reduce((sum, u) => sum + u.balance, 0)

  const uniqueDates = useMemo(() => {
    if (!mealCosts) return []
    const dates = new Set(mealCosts.map(m => m.meal_date))
    return Array.from(dates).sort()
  }, [mealCosts])

  const dailyAttendance = useMemo(() => {
    const map: Record<string, Record<string, { lunch: number, dinner: number }>> = {}
    if (!mealCosts) return map

    mealCosts.forEach(meal => {
        if (!map[meal.meal_date]) map[meal.meal_date] = {}
        if (!map[meal.meal_date][meal.user_id]) map[meal.meal_date][meal.user_id] = { lunch: 0, dinner: 0 }
        
        const weight = Number(meal.meal_weight) || 0

        if (meal.meal_type === 'Lunch') map[meal.meal_date][meal.user_id].lunch = weight
        if (meal.meal_type === 'Dinner') map[meal.meal_date][meal.user_id].dinner = weight
    })
    return map
  }, [mealCosts])


  const FIXED_UTILITIES = [
    'House Rent',
    'Guard',
    'Service Charge',
    'WiFi Bill',
    'Line Gas Bill',
    'Bua',
    'Cylinder',
    'Electricity'
  ]

  const utilityMatrix = useMemo(() => {
     const map: Record<string, Record<string, number>> = {} 
     if (!utilityCollections) return map

     utilityCollections.forEach(col => {
         if (!map[col.user_id]) map[col.user_id] = {}
         map[col.user_id][col.utility_type] = Number(col.amount)
     })
     return map
  }, [utilityCollections])

  const getUtilityCollectedTotal = (utilityType: string) => {
    let total = 0
    userSummaries.forEach(u => {
        total += utilityMatrix[u.userId]?.[utilityType] || 0
    })
    return total
  }

  const getUserUtilityTotal = (userId: string) => {
    let total = 0
    FIXED_UTILITIES.forEach(ut => {
        total += utilityMatrix[userId]?.[ut] || 0
    })
    return total
  }

  const totalUtilityCollections = FIXED_UTILITIES.reduce((sum, ut) => sum + getUtilityCollectedTotal(ut), 0)

  // Common styles
  const styles = {
    page: {
      backgroundColor: '#ffffff',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px',
      minHeight: '1050px',
    },
    headerBanner: {
      background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
      borderRadius: '12px',
      padding: '32px 40px',
      marginBottom: '32px',
      boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)',
    },
    headerTitle: {
      color: '#ffffff',
      fontSize: '28px',
      fontWeight: '700',
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
      margin: '0 0 8px 0',
      textAlign: 'center' as const,
    },
    headerSubtitle: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: '16px',
      fontWeight: '500',
      textAlign: 'center' as const,
      margin: 0,
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '20px',
      marginBottom: '32px',
    },
    summaryCard: (bgColor: string, accentColor: string) => ({
      backgroundColor: bgColor,
      borderRadius: '12px',
      padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${accentColor}`,
    }),
    cardLabel: (color: string) => ({
      color: color,
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      marginBottom: '8px',
    }),
    cardValue: {
      fontSize: '26px',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0,
    },
    sectionTitle: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#374151',
      textTransform: 'uppercase' as const,
      letterSpacing: '1.5px',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '2px solid #0d9488',
      display: 'inline-block',
    },
    tableContainer: {
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid #e5e7eb',
      marginBottom: '28px',
    },
    tableHeader: {
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
    },
    tableHeaderCell: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '11px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      padding: '14px 16px',
    },
    tableRow: (isEven: boolean) => ({
      backgroundColor: isEven ? '#ffffff' : '#f9fafb',
    }),
    tableCell: {
      padding: '12px 16px',
      fontSize: '13px',
      borderBottom: '1px solid #e5e7eb',
    },
    tableTotalRow: {
      background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
    },
    tableTotalCell: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: '13px',
      padding: '14px 16px',
    },
    pageFooter: {
      textAlign: 'center' as const,
      fontSize: '10px',
      color: '#9ca3af',
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb',
    },
    page2Header: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '24px',
      paddingBottom: '12px',
      borderBottom: '2px solid #0d9488',
    },
  }

  return (
    <div ref={ref} style={{ width: '794px', margin: '0 auto', backgroundColor: '#ffffff', color: '#1f2937' }}>
        
        {/* --- PAGE 1: SUMMARY & DEPOSITS --- */}
        <div style={styles.page}>
            {/* Header Banner */}
            <div style={styles.headerBanner}>
                <h1 style={styles.headerTitle}>📊 Banasree Flat Manager</h1>
                <p style={styles.headerSubtitle}>Monthly Financial Report • {monthLabel}</p>
            </div>

            {/* Summary Cards */}
            <div style={styles.summaryGrid}>
                <div style={styles.summaryCard('#f0fdfa', '#0d9488')}>
                    <p style={styles.cardLabel('#0d9488')}>🛒 Total Shopping</p>
                    <p style={styles.cardValue}>৳{totalBajar.toLocaleString()}</p>
                </div>
                <div style={styles.summaryCard('#fff7ed', '#ea580c')}>
                    <p style={styles.cardLabel('#ea580c')}>⚖️ Total Weight</p>
                    <p style={styles.cardValue}>{totalMealWeight}</p>
                </div>
                <div style={styles.summaryCard('#eff6ff', '#2563eb')}>
                    <p style={styles.cardLabel('#2563eb')}>💰 Meal Rate</p>
                    <p style={styles.cardValue}>৳{mealRate.toFixed(2)}</p>
                </div>
                <div style={styles.summaryCard('#faf5ff', '#9333ea')}>
                    <p style={styles.cardLabel('#9333ea')}>📋 Common Exp.</p>
                    <p style={styles.cardValue}>৳{commonExpenses?.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Main Financial Table */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={styles.sectionTitle}>Financial Summary</h3>
                <div style={styles.tableContainer}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'left' }}>Name</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Weight</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Cost</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Deposits</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Common</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userSummaries.map((u, i) => (
                                <tr key={u.userId} style={styles.tableRow(i % 2 === 0)}>
                                    <td style={{ ...styles.tableCell, fontWeight: '600' }}>{u.name}</td>
                                    <td style={{ ...styles.tableCell, textAlign: 'center' }}>{u.totalWeight}</td>
                                    <td style={{ ...styles.tableCell, textAlign: 'right' }}>৳{u.cost.toFixed(1)}</td>
                                    <td style={{ ...styles.tableCell, textAlign: 'right' }}>৳{u.rawDeposit.toFixed(0)}</td>
                                    <td style={{ ...styles.tableCell, textAlign: 'right' }}>-৳{u.commonExpense.toFixed(0)}</td>
                                    <td style={{ 
                                        ...styles.tableCell, 
                                        textAlign: 'right', 
                                        fontWeight: '700',
                                        color: u.balance >= 0 ? '#059669' : '#dc2626' 
                                    }}>
                                        ৳{u.balance.toFixed(0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={styles.tableTotalRow}>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'left' }}>TOTAL</td>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'center' }}>{totalMealWeight}</td>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>৳{totalBajar.toLocaleString()}</td>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>৳{userSummaries.reduce((s, u)=>s+u.rawDeposit, 0).toLocaleString()}</td>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>৳{userSummaries.reduce((s, u)=>s+u.commonExpense, 0).toLocaleString()}</td>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>৳{totalBalanceSum.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

             {/* Detailed Deposit Table Breakdown */}
             <div>
                <h3 style={styles.sectionTitle}>Deposit Breakdown</h3>
                <div style={styles.tableContainer}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'left' }}>Name</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>CF</th>
                                {[1,2,3,4,5,6,7,8].map(d => (
                                    <th key={d} style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>D{d}</th>
                                ))}
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                             {userSummaries.map((u, i) => (
                                <tr key={u.userId} style={styles.tableRow(i % 2 === 0)}>
                                    <td style={{ ...styles.tableCell, fontWeight: '500' }}>{u.name}</td>
                                    <td style={{ ...styles.tableCell, textAlign: 'center', color: '#6b7280' }}>{u.depositRecord?.carry_forward || '-'}</td>
                                    {[1,2,3,4,5,6,7,8].map(d => {
                                        // @ts-ignore
                                        const val = u.depositRecord?.[`d${d}`]
                                        return (
                                            <td key={d} style={{ ...styles.tableCell, textAlign: 'center' }}>{val || '-'}</td>
                                        )
                                    })}
                                    <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '700' }}>৳{u.rawDeposit}</td>
                                </tr>
                             ))}
                        </tbody>
                    </table>
                </div>
             </div>
             
             {/* Footer */}
             <div style={styles.pageFooter}>Page 1 of 2 • Generated on {new Date().toLocaleDateString()}</div>
        </div>

        {/* --- PAGE 2: BAJAR, COMMON, UTILITY --- */}
        <div style={{ ...styles.page, pageBreakBefore: 'always' }}>
            <h2 style={styles.page2Header}>Shopping & Expenses</h2>

            {/* Bajar List */}
            <div style={{ marginBottom: '28px' }}>
                <h3 style={styles.sectionTitle}>Daily Bajar List</h3>
                <div style={styles.tableContainer}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'left', width: '60px' }}>Date</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'left' }}>Item</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right', width: '80px' }}>Cost</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right', width: '100px' }}>Buyer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bajarItems?.map((item, i) => (
                                <tr key={item.id} style={styles.tableRow(i % 2 === 0)}>
                                    <td style={{ ...styles.tableCell, color: '#6b7280' }}>{new Date(item.purchase_date).getDate()}</td>
                                    <td style={{ ...styles.tableCell, fontWeight: '500' }}>{item.item_name}</td>
                                    <td style={{ ...styles.tableCell, textAlign: 'right' }}>৳{item.cost}</td>
                                    <td style={{ ...styles.tableCell, textAlign: 'right', fontSize: '11px', color: '#6b7280' }}>{item.user?.name}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={styles.tableTotalRow}>
                                <td colSpan={2} style={{ ...styles.tableTotalCell, textAlign: 'right' }}>Total</td>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>৳{totalBajar}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Common Expenses */}
            <div style={{ marginBottom: '28px' }}>
                <h3 style={styles.sectionTitle}>Common Expenses</h3>
                <div style={styles.tableContainer}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'left' }}>Description</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commonExpenses?.map((e, i) => (
                                <tr key={e.id} style={styles.tableRow(i % 2 === 0)}>
                                    <td style={styles.tableCell}>{e.description}</td>
                                    <td style={{ ...styles.tableCell, textAlign: 'right' }}>৳{e.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={styles.tableTotalRow}>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>Total</td>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>৳{commonExpenses?.reduce((s, e)=>s+Number(e.amount), 0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Utilities Section */}
            <div style={{ marginBottom: '28px' }}>
                <h3 style={styles.sectionTitle}>Utility Costs</h3>
                <div style={styles.tableContainer}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'left' }}>Utility Name</th>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Total Bill</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FIXED_UTILITIES.map((ut, i) => {
                                const expense = utilityExpenses?.find(u => u.expense_type === ut)
                                const amount = expense ? Number(expense.amount) : 0
                                return (
                                    <tr key={ut} style={styles.tableRow(i % 2 === 0)}>
                                        <td style={styles.tableCell}>{ut}</td>
                                        <td style={{ ...styles.tableCell, textAlign: 'right' }}>৳{amount}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={styles.tableTotalRow}>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>Total</td>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>৳{utilityExpenses?.reduce((s, u)=>s+Number(u.amount), 0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Utility Deposits Breakdown */}
            <div style={{ marginBottom: '28px' }}>
                <h3 style={styles.sectionTitle}>Utility Deposits</h3>
                <div style={styles.tableContainer}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'left' }}>Expense Type</th>
                                {userSummaries.map(u => (
                                    <th key={u.userId} style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>
                                        {u.name.split(' ')[0]}
                                    </th>
                                ))}
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Collected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FIXED_UTILITIES.map((ut, i) => {
                                const totalCollected = getUtilityCollectedTotal(ut)
                                return (
                                    <tr key={ut} style={styles.tableRow(i % 2 === 0)}>
                                        <td style={{ ...styles.tableCell, fontWeight: '500' }}>{ut}</td>
                                        {userSummaries.map(u => {
                                            const val = utilityMatrix[u.userId]?.[ut] || 0
                                            return (
                                                <td key={u.userId} style={{ ...styles.tableCell, textAlign: 'center', color: '#6b7280' }}>
                                                    {val > 0 ? val : '-'}
                                                </td>
                                            )
                                        })}
                                        <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '600' }}>
                                            {totalCollected > 0 ? totalCollected.toLocaleString() : '0'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={styles.tableTotalRow}>
                                <td style={styles.tableTotalCell}>Total</td>
                                 {userSummaries.map(u => {
                                     const userTotal = getUserUtilityTotal(u.userId)
                                     return <td key={u.userId} style={{ ...styles.tableTotalCell, textAlign: 'center' }}>{userTotal}</td>
                                 })}
                                 <td style={{ ...styles.tableTotalCell, textAlign: 'right' }}>
                                    {totalUtilityCollections.toLocaleString()}
                                 </td>
                             </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            
            {/* Daily Meal Attendance */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={styles.sectionTitle}>Daily Meal Attendance</h3>
                <div style={styles.tableContainer}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'center', width: '40px' }}>Date</th>
                                {userSummaries.map(u => (
                                    <th key={u.userId} style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>
                                        {u.name.split(' ')[0]}
                                    </th>
                                ))}
                                <th style={{ ...styles.tableHeaderCell, textAlign: 'center', backgroundColor: '#374151' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uniqueDates.map((date, i) => {
                                const day = new Date(date).getDate();
                                let daysTotal = 0;
                                return (
                                    <tr key={date} style={styles.tableRow(i % 2 === 0)}>
                                        <td style={{ ...styles.tableCell, textAlign: 'center', fontWeight: '600', backgroundColor: '#f3f4f6' }}>{day}</td>
                                        {userSummaries.map(u => {
                                            const record = dailyAttendance[date]?.[u.userId];
                                            const lunch = record?.lunch || 0;
                                            const dinner = record?.dinner || 0;
                                            const total = lunch + dinner;
                                            daysTotal += total;
                                            return (
                                                <td key={u.userId} style={{ ...styles.tableCell, textAlign: 'center' }}>
                                                    {total > 0 ? (
                                                        <span>
                                                            <span style={{ fontWeight: lunch > 0 ? '700' : '400', color: lunch > 0 ? '#1f2937' : '#d1d5db' }}>{lunch}</span>
                                                            <span style={{ color: '#d1d5db' }}>/</span>
                                                            <span style={{ fontWeight: dinner > 0 ? '700' : '400', color: dinner > 0 ? '#1f2937' : '#d1d5db' }}>{dinner}</span>
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#e5e7eb' }}>-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td style={{ ...styles.tableCell, textAlign: 'center', fontWeight: '600', backgroundColor: '#f3f4f6' }}>{daysTotal}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={styles.tableTotalRow}>
                                <td style={{ ...styles.tableTotalCell, textAlign: 'center' }}>TOT</td>
                                {userSummaries.map(u => (
                                    <td key={u.userId} style={{ ...styles.tableTotalCell, textAlign: 'center' }}>{u.totalWeight}</td>
                                ))}
                                <td style={{ ...styles.tableTotalCell, textAlign: 'center' }}>{totalMealWeight}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280' }}>Key: Lunch / Dinner weight. (0 = no meal)</div>
            </div>
            
            {/* Footer */}
            <div style={styles.pageFooter}>Page 2 of 2 • Generated on {new Date().toLocaleDateString()}</div>
        </div>
    </div>
  )
})

MonthlyReport.displayName = 'MonthlyReport'
