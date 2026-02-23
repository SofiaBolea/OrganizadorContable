"use client";
import { useState, useEffect } from "react";
import { Card, Title, BarChart, Subtitle, TabGroup, TabList, Tab, Grid, Metric, Text } from "@tremor/react";

export default function ReporteDashboard() {
  const [index, setIndex] = useState(0);
  const [data, setData] = useState([]);
  const periodos = ["semanal", "quincenal", "mensual"];

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/reportes?periodo=${periodos[index]}`);
      const result = await res.json();
      setData(result);
    }
    fetchData();
  }, [index]);

  // Cálculos totales para los KPIs superiores
  const totales = data.reduce((acc, curr: any) => ({
    completadas: acc.completadas + curr.Completadas,
    pendientes: acc.pendientes + curr.Pendientes,
    vencidas: acc.vencidas + curr.Vencidas
  }), { completadas: 0, pendientes: 0, vencidas: 0 });

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-center">
        <div>
          <Title>Dashboard de Reportes</Title>
          <Text>Visualiza el desempeño del equipo por periodo.</Text>
        </div>
        
        <TabGroup index={index} onIndexChange={setIndex}>
          <TabList variant="solid">
            <Tab>Semanal</Tab>
            <Tab>Quincenal</Tab>
            <Tab>Mensual</Tab>
          </TabList>
        </TabGroup>
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        <Card decoration="top" decorationColor="emerald">
          <Text>Total Completadas</Text>
          <Metric>{totales.completadas}</Metric>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Total Pendientes</Text>
          <Metric>{totales.pendientes}</Metric>
        </Card>
        <Card decoration="top" decorationColor="rose">
          <Text>Total Vencidas</Text>
          <Metric>{totales.vencidas}</Metric>
        </Card>
      </Grid>

      <Card>
        <Title>Tareas por Asistente</Title>
        <Subtitle>Distribución de estados de tareas según el responsable.</Subtitle>
        <BarChart
          className="mt-6 h-80"
          data={data}
          index="name"
          categories={["Completadas", "Pendientes", "Vencidas"]}
          colors={["emerald", "amber", "rose"]}
          yAxisWidth={48}
          stack={true}
          showAnimation={true}
        />
      </Card>
    </div>
  );
}