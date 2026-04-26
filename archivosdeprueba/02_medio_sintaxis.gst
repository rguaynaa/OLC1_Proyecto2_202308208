
struct Persona {
string Nombre;
bool EsEstudiante;
}

struct Curso {
string Nombre;
Persona Tutor;
}

func sumarLista(datos []int) int {
total := 0
for i := 0; i < len(datos); i++ {
total += datos[i]
}
return total
}

func obtenerEstado(nota int) string {
if nota >= 90 {
return "Sobresaliente"
} else if nota >= 70 {
return "Aprobado"
} else {
return "Reprobado"
}
}

func main() {
notas := []int{61, 75, 88, 95}
palabras := []string{"Compiladores", "OLC1", "Proyecto"}
matriz := [][]int{
{10, 20},
{30, 40},
{50, 60}
}

Persona tutor = {Nombre:"Marcos", EsEstudiante: false}
Curso c = {Nombre:"GoScript", Tutor: tutor}

fmt.Println("Curso:", c)
fmt.Println("Palabras:", strings.Join(palabras, " | "))
fmt.Println("Total notas:", sumarLista(notas))
fmt.Println("Estado de 88:", obtenerEstado(88))

for indice, valor := range notas {
fmt.Println("Nota en posicion", indice, "=", valor)
}

for i := 0; i < len(matriz); i++ {
for j := 0; j < len(matriz[i]); j++ {
fmt.Println("Matriz", i, j, "=", matriz[i][j])
}
}

{
mensaje := "Bloque interno"
fmt.Println(mensaje)
}

contador := 0
for contador < 3 {
fmt.Println("Contador:", contador)
contador++
}

switch obtenerEstado(61) {
case "Sobresaliente":
fmt.Println("Muy alta")
case "Aprobado":
fmt.Println("Aceptable")
default:
fmt.Println("Necesita mejorar")
}
}
