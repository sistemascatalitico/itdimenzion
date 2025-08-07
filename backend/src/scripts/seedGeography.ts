import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const colombianData = {
  country: { name: 'Colombia', code: 'CO' },
  states: [
    {
      name: 'Antioquia',
      code: 'ANT',
      cities: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'La Estrella', 'Caldas', 'Copacabana', 'Girardota', 'Barbosa']
    },
    {
      name: 'Cundinamarca',
      code: 'CUN',
      cities: ['Bogotá', 'Soacha', 'Chía', 'Zipaquirá', 'Facatativá', 'Cajicá', 'Mosquera', 'Funza', 'Madrid', 'Cota']
    },
    {
      name: 'Valle del Cauca',
      code: 'VAL',
      cities: ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Buga', 'Cartago', 'Jamundí', 'Yumbo', 'Candelaria', 'Florida']
    },
    {
      name: 'Atlántico',
      code: 'ATL',
      cities: ['Barranquilla', 'Soledad', 'Malambo', 'Galapa', 'Sabanagrande', 'Santo Tomás', 'Baranoa', 'Tubará', 'Usiacurí', 'Repelón']
    },
    {
      name: 'Santander',
      code: 'SAN',
      cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'San Gil', 'Barrancabermeja', 'Málaga', 'Socorro', 'Vélez', 'Barbosa']
    },
    {
      name: 'Bolívar',
      code: 'BOL',
      cities: ['Cartagena', 'Magangué', 'Turbaco', 'El Carmen de Bolívar', 'Arjona', 'San Jacinto', 'María la Baja', 'Clemencia', 'Santa Rosa', 'Villanueva']
    },
    {
      name: 'Norte de Santander',
      code: 'NSA',
      cities: ['Cúcuta', 'Villa del Rosario', 'Los Patios', 'Ocaña', 'Pamplona', 'Tibú', 'El Zulia', 'San Cayetano', 'Puerto Santander', 'Villa Caro']
    },
    {
      name: 'Córdoba',
      code: 'COR',
      cities: ['Montería', 'Lorica', 'Cereté', 'Sahagún', 'Planeta Rica', 'Ciénaga de Oro', 'Montelíbano', 'Tierralta', 'Ayapel', 'San Pelayo']
    },
    {
      name: 'Tolima',
      code: 'TOL',
      cities: ['Ibagué', 'Espinal', 'Melgar', 'Honda', 'Mariquita', 'Líbano', 'Chaparral', 'Purificación', 'Flandes', 'Girardot']
    },
    {
      name: 'Huila',
      code: 'HUI',
      cities: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Aipe', 'Palermo', 'Rivera', 'Isnos', 'Saladoblanco']
    }
  ]
};

const usaData = {
  country: { name: 'United States', code: 'US' },
  states: [
    {
      name: 'California',
      code: 'CA',
      cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San José', 'Fresno', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim']
    },
    {
      name: 'Texas',
      code: 'TX',
      cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock']
    },
    {
      name: 'Florida',
      code: 'FL',
      cities: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral']
    },
    {
      name: 'New York',
      code: 'NY',
      cities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica']
    },
    {
      name: 'Pennsylvania',
      code: 'PA',
      cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'Altoona']
    },
    {
      name: 'Illinois',
      code: 'IL',
      cities: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria', 'Elgin', 'Waukegan', 'Cicero']
    },
    {
      name: 'Ohio',
      code: 'OH',
      cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton', 'Youngstown', 'Lorain']
    },
    {
      name: 'Georgia',
      code: 'GA',
      cities: ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell', 'Johns Creek', 'Albany']
    },
    {
      name: 'North Carolina',
      code: 'NC',
      cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington', 'High Point', 'Greenville']
    },
    {
      name: 'Michigan',
      code: 'MI',
      cities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing', 'Ann Arbor', 'Flint', 'Dearborn', 'Livonia', 'Westland']
    }
  ]
};

async function seedGeography() {
  console.log('🌍 Starting geography data seeding...');

  try {
    // Seed Colombia
    console.log('🇨🇴 Seeding Colombia data...');
    const colombiaCountry = await prisma.country.upsert({
      where: { code: colombianData.country.code },
      update: {},
      create: colombianData.country
    });

    for (const stateData of colombianData.states) {
      const state = await prisma.state.upsert({
        where: {
          name_countryId: {
            name: stateData.name,
            countryId: colombiaCountry.id
          }
        },
        update: {},
        create: {
          name: stateData.name,
          code: stateData.code,
          countryId: colombiaCountry.id
        }
      });

      for (const cityName of stateData.cities) {
        await prisma.city.upsert({
          where: {
            name_stateId: {
              name: cityName,
              stateId: state.id
            }
          },
          update: {},
          create: {
            name: cityName,
            stateId: state.id
          }
        });
      }
    }

    // Seed USA
    console.log('🇺🇸 Seeding USA data...');
    const usaCountry = await prisma.country.upsert({
      where: { code: usaData.country.code },
      update: {},
      create: usaData.country
    });

    for (const stateData of usaData.states) {
      const state = await prisma.state.upsert({
        where: {
          name_countryId: {
            name: stateData.name,
            countryId: usaCountry.id
          }
        },
        update: {},
        create: {
          name: stateData.name,
          code: stateData.code,
          countryId: usaCountry.id
        }
      });

      for (const cityName of stateData.cities) {
        await prisma.city.upsert({
          where: {
            name_stateId: {
              name: cityName,
              stateId: state.id
            }
          },
          update: {},
          create: {
            name: cityName,
            stateId: state.id
          }
        });
      }
    }

    console.log('✅ Geography data seeded successfully!');
    
    // Show summary
    const countriesCount = await prisma.country.count();
    const statesCount = await prisma.state.count();
    const citiesCount = await prisma.city.count();
    
    console.log(`📊 Summary:`);
    console.log(`   Countries: ${countriesCount}`);
    console.log(`   States/Departments: ${statesCount}`);
    console.log(`   Cities: ${citiesCount}`);

  } catch (error) {
    console.error('❌ Error seeding geography data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedGeography()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export { seedGeography };