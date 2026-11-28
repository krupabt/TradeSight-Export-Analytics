// Power Query M Script: Dim_Products
let
    Source = Csv.Document(File.Contents("data/Dim_Products.csv"),[Delimiter=",", Columns=12, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{
        {"Product_ID", type text},
        {"Name", type text},
        {"Category", type text},
        {"MRP", type number},
        {"COGS", type number},
        {"Stock_Units", Int64.Type},
        {"Avg_Monthly_Sales", type number},
        {"Gross_Margin_INR", type number},
        {"Gross_Margin_Pct", type number},
        {"Cost_Markup_Pct", type number},
        {"Total_Inventory_Value_COGS", type number},
        {"Total_Inventory_Value_MRP", type number}
    })
in
    #"Changed Type"
