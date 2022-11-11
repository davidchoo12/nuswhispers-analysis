package handler

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
)

func rowsToCsvBytes(records [][]string) ([]byte, error) {
	if len(records) == 0 {
		return nil, errors.New("records cannot be nil or empty")
	}
	var buf bytes.Buffer
	csvWriter := csv.NewWriter(&buf)
	err := csvWriter.WriteAll(records)
	if err != nil {
		return nil, err
	}
	csvWriter.Flush()
	if err := csvWriter.Error(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func Handler(w http.ResponseWriter, r *http.Request) {
	// construct query regex
	query := r.URL.Query().Get("q")
	re := regexp.MustCompile(`[-.\+*?\[^\]$(){}=!<>|:\\]`)
	sanitizedQuery := re.ReplaceAll([]byte(query), []byte(``))
	if len(sanitizedQuery) < 3 {
		w.WriteHeader(400)
		w.Write([]byte("search with min 3 chars"))
		return
	}
	fmt.Println("query", query, "sanitizedQuery", string(sanitizedQuery))
	queryRegexStr := fmt.Sprintf(`(?i)\b%s\b`, sanitizedQuery)
	queryRegex, err := regexp.Compile(queryRegexStr)
	if err != nil {
		fmt.Println("regexp compile err", err)
		w.Write([]byte("fail to compile query regex"))
		return
	}

	// glob data csv
	pwd, _ := os.Getwd()
	fmt.Println(pwd)
	paths, _ := filepath.Glob(filepath.Join(pwd, "scraper/data/data-0-*.csv"))
	dataCsvPath := paths[0]
	fmt.Println(dataCsvPath)

	// read data csv
	f, err := os.Open(dataCsvPath)
	if err != nil {
		w.WriteHeader(500)
		w.Write([]byte(fmt.Sprintf("read data csv err %s", err)))
		return
	}
	csvReader := csv.NewReader(f)

	// filter rows
	filteredRows := make([][]string, 0)
	for row, err := csvReader.Read(); row != nil; row, err = csvReader.Read() {
		if err != nil && err == csv.ErrFieldCount {
			fmt.Println("ErrFieldCount, skipping no", row[0])
			continue
		}
		text := row[1]
		if queryRegex.Match([]byte(text)) {
			filteredRows = append(filteredRows, row)
		}
	}
	fmt.Println("len(filteredRows)", len(filteredRows))

	// convert rows to csv bytes
	b, err := rowsToCsvBytes(filteredRows)
	if err != nil {
		w.WriteHeader(500)
		w.Write([]byte(fmt.Sprintf("rowsToCsvBytes err %s", err)))
		return
	}
	fmt.Println("len(b)", len(b))

	// write response
	wr, err := io.Copy(w, bytes.NewReader(b))
	if err != nil {
		fmt.Println(wr, err)
	} else {
		fmt.Println("Written", wr, "bytes")
	}
}

func main() {
	http.HandleFunc("/", Handler)
	fmt.Println("listening localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	fmt.Println("err", err)
}
