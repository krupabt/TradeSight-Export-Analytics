// Power Query M Script: Dim_Customers
let
    Source = Csv.Document(File.Contents("data/Dim_Customers.csv"),[Delimiter=",", Columns=11, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{
        {"Customer_ID", type text},
        {"City", type text},
        {"Age_Band", type text},
        {"Gender", type text},
        {"Acquisition_Channel", type text},
        {"First_Purchase_Date", type date},
        {"Total_Orders", Int64.Type},
        {"Total_Revenue", type number},
        {"Last_Purchase_Date", type date},
        {"Churned", Int64.Type},
        {"Status", type text}
    })
in
    #"Changed Type"
