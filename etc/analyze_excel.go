package main

import (
	"fmt"
	"log"

	"github.com/xuri/excelize/v2"
)

func main() {
	// Path to the Excel file
	excelPath := "products_detailed.xlsx"

	// Open the Excel file
	f, err := excelize.OpenFile(excelPath)
	if err != nil {
		log.Fatalf("Failed to open Excel file: %v", err)
	}
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Printf("Error closing file: %v\n", err)
		}
	}()

	// Get all sheet names
	sheets := f.GetSheetList()
	fmt.Printf("📊 تعداد شیت‌ها: %d\n", len(sheets))
	for i, sheet := range sheets {
		fmt.Printf("   %d. %s\n", i+1, sheet)
	}
	fmt.Println()

	// Analyze each sheet
	for _, sheetName := range sheets {
		fmt.Printf("🔍 تحلیل شیت: %s\n", sheetName)
		fmt.Println("=" + string(make([]rune, 50)) + "=")

		// Get all rows
		rows, err := f.GetRows(sheetName)
		if err != nil {
			fmt.Printf("خطا در خواندن شیت %s: %v\n", sheetName, err)
			continue
		}

		if len(rows) == 0 {
			fmt.Printf("شیت %s خالی است\n\n", sheetName)
			continue
		}

		// Print header row
		fmt.Printf("📋 سرستون‌ها (%d ستون):\n", len(rows[0]))
		for i, header := range rows[0] {
			fmt.Printf("   %d. %s\n", i+1, header)
		}
		fmt.Println()

		// Print number of rows
		fmt.Printf("📈 تعداد ردیف‌ها: %d (شامل سرستون)\n", len(rows))
		fmt.Printf("📈 تعداد رکورد داده: %d\n", len(rows)-1)
		fmt.Println()

		// Print first few data rows as sample
		fmt.Printf("📝 نمونه داده‌ها (5 ردیف اول):\n")
		maxRows := 6 // Header + 5 data rows
		if len(rows) < maxRows {
			maxRows = len(rows)
		}

		for i := 0; i < maxRows; i++ {
			fmt.Printf("ردیف %d: ", i)
			if i == 0 {
				fmt.Print("[سرستون] ")
			}

			for j, cell := range rows[i] {
				if j > 10 { // Show only first 10 columns to avoid clutter
					fmt.Print("...")
					break
				}
				if cell == "" {
					cell = "[خالی]"
				}
				fmt.Printf("%s", cell)
				if j < len(rows[i])-1 && j < 10 {
					fmt.Print(" | ")
				}
			}
			fmt.Println()
		}
		fmt.Println()

		// Analyze data types and patterns
		if len(rows) > 1 {
			fmt.Printf("🔍 تحلیل انواع داده‌ها:\n")
			headers := rows[0]
			for colIndex, header := range headers {
				if colIndex >= 10 {
					break // Only analyze first 10 columns
				}

				fmt.Printf("   %s: ", header)

				// Sample values from this column
				var sampleValues []string
				for rowIndex := 1; rowIndex < len(rows) && len(sampleValues) < 3; rowIndex++ {
					if colIndex < len(rows[rowIndex]) && rows[rowIndex][colIndex] != "" {
						sampleValues = append(sampleValues, rows[rowIndex][colIndex])
					}
				}

				if len(sampleValues) > 0 {
					fmt.Printf("نمونه‌ها: %v", sampleValues)
				} else {
					fmt.Printf("بدون داده")
				}
				fmt.Println()
			}
		}
		fmt.Println()
	}
}
