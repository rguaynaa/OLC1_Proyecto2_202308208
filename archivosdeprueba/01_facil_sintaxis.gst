
struct Persona {
string Nombre;
bool EsEstudiante;
}

func imprimirResumen(nombre string, edad int, activo bool) {
fmt.Println("Resumen:", nombre, edad, activo)
}

func main() {
var edad int = 19
var promedio float64 = 81.5
var nombre string = "Lucia"
var activo bool = true
var inicial rune = 'L'

fmt.Println("Inicio del programa")
fmt.Println("Nombre:", nombre)
fmt.Println("Edad:", edad)
fmt.Println("Promedio:", promedio)
fmt.Println("Inicial:", inicial)

edad = edad + 1
promedio += 3
nombre = nombre + " Perez"

if activo {
fmt.Println("Estado activo")
} else {
fmt.Println("Estado inactivo")
}

numeros := []int{1, 2, 3, 4}
numeros = append(numeros, 5)
fmt.Println("Cantidad:", len(numeros))
fmt.Println("Indice de 4:", slices.Index(numeros, 4))

for i := 0; i < len(numeros); i++ {
fmt.Println("Elemento:", numeros[i])
}

switch edad {
case 18:
fmt.Println("Tiene 18")
case 20:
fmt.Println("Tiene 20")
default:
fmt.Println("Otra edad")
}

Persona p = {Nombre:"Alice", EsEstudiante: true}
fmt.Println("Struct:", p)

imprimirResumen(nombre, edad, activo)
fmt.Println("Fin del programa")
}
