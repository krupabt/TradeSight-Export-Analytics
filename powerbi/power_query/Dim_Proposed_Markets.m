// Power Query M Script: Dim_Proposed_Markets
let
    Source = Csv.Document(File.Contents("data/Dim_Proposed_Markets.csv"),[Delimiter=",", Columns=6, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{
        {"Country", type text},
        {"ISO3", type text},
        {"Region", type text},
        {"Port_of_Discharge", type text},
        {"Incoterm", type text},
        {"Target_Priority", type text}
    })
in
    #"Changed Type"
