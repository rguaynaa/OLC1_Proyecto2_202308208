
struct Persona {
string Nombre;
bool EsEstudiante;
}

struct Equipo {
string Nombre;
Persona Lider;
}

func esMayorQueLimite(valor int, limite int) bool {
return valor > limite
}

func contarMayores(datos []int, limite int) int {
cantidad := 0
for i := 0; i < len(datos); i++ {
if esMayorQueLimite(datos[i], limite) {
cantidad += 1
}
}
return cantidad
}

func construirMensaje(nombre string, cantidad int, promedio float64) string {
return "Usuario: " + nombre + " Cantidad: " + cantidad + " Promedio: " + promedio
}

func promedioLista(datos []int) float64 {
suma := 0
for i := 0; i < len(datos); i++ {
suma += datos[i]
}
return suma / len(datos)
}

func main() {
valores := []int{12, 45, 67, 23, 90, 34}
nombres := []string{"Ana", "Luis", "Pedro", "Maria"}
grid := [][]int{
{1, 2, 3, 4},
{5, 6, 7, 8},
{9, 10, 11, 12}
}

Persona lider = {Nombre:"Sofia", EsEstudiante: true}
Equipo equipo1 = {Nombre:"Analisis", Lider: lider}

fmt.Println("Equipo:", equipo1)
fmt.Println("Nombres:", strings.Join(nombres, ", "))
fmt.Println("Total elementos:", len(valores))
fmt.Println("Cantidad mayores a 40:", contarMayores(valores, 40))
fmt.Println("Promedio:", promedioLista(valores))
fmt.Println(construirMensaje(lider.Nombre, len(valores), promedioLista(valores)))

for i := 0; i < len(valores); i++ {
if valores[i] < 20 {
fmt.Println("Valor pequeño:", valores[i])
continue
}
fmt.Println("Valor procesado:", valores[i])
if valores[i] == 90 {
fmt.Println("Se encontro el valor de corte")
break
}
}

for fila := 0; fila < len(grid); fila++ {
for columna := 0; columna < len(grid[fila]); columna++ {
fmt.Println("Grid", fila, columna, "=", grid[fila][columna])
}
}

{
equipo1 := "Variable local con sombreado"
fmt.Println(equipo1)
}

indiceLuis := slices.Index(nombres, "Luis")
fmt.Println("Indice de Luis:", indiceLuis)

switch indiceLuis {
case 0:
fmt.Println("Esta al inicio")
case 1:
fmt.Println("Esta en posicion 1")
default:
fmt.Println("Otra posicion")
}
}
