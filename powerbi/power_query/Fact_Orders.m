// Power Query M Script: Fact_Orders
let
    Source = Csv.Document(File.Contents("data/Fact_Orders.csv"),[Delimiter=",", Columns=21, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{
        {"order_id", type text},
        {"buyer_id", type text},
        {"seller_id", type text},
        {"category", type text},
        {"order_date", type date},
        {"quantity_units", Int64.Type},
        {"unit_price_inr", type number},
        {"total_value_inr", type number},
        {"payment_terms", type text},
        {"delivery_days", Int64.Type},
        {"on_time_delivery", Int64.Type},
        {"return_qty", Int64.Type},
        {"repeat_buyer", Int64.Type},
        {"OrderDateKey", Int64.Type},
        {"Order_Year", Int64.Type},
        {"Order_Month", type text},
        {"Order_Quarter", type text},
        {"SLA_Status", type text},
        {"Has_Return", type text},
        {"Invalid_Return_Flag", Int64.Type},
        {"Value_Category", type text}
    })
in
    #"Changed Type"
