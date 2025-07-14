import yfinance as yf

empresas = {
    "Nutresa": "NUTRESA.CL",
    "GrupoSura": "GRUPOSURA.CL",
    "Bancolombia": "BCOLOMBIA.CL",
    "Celsia": "CELSIA.CL",
    "ISA": "ISA.CL"
}


start_date = "2015-01-01"
end_date = "2025-07-01"
intervalo = "1mo"

for nombre, ticker in empresas.items():
    df = yf.download(ticker, start=start_date, end=end_date, interval=intervalo)
    
    # Redondear valores numéricos a 2 decimales
    df = df.round(2)
    
    
    df.to_csv(f"{nombre}_COP.csv")
    print(f"Archivo CSV generado: {nombre}_COP.csv")

print("¡Descarga mensual completada en pesos colombianos!")
