// Power Query M Script: Dim_Date
let
    Source = Csv.Document(File.Contents("data/Dim_Date.csv"),[Delimiter=",", Columns=10, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{
        {"Date", type date},
        {"DateKey", Int64.Type},
        {"Year", Int64.Type},
        {"Quarter", type text},
        {"YearQuarter", type text},
        {"Month", Int64.Type},
        {"MonthName", type text},
        {"YearMonth", type text},
        {"DayOfWeek", type text},
        {"IsWeekend", Int64.Type}
    })
in
    #"Changed Type"
