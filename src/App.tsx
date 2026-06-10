import { useEffect, useRef, useState} from 'react';
import './App.css';
import greenCheck from './assets/green-check.png';
import trash from './assets/trash.png';
import restore from "./assets/restore.png"

//logic ===============================================================================================

// main structure of our player stats and
// how much of stats a habit gives
interface HabitStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  spiritual: number;
  emotional: number;
  reputation: number;
  discipline: number;
  creativity: number;
}

// structure of a habit JSON
interface HabitFormat {
  id: string;
  title: string;
  hour: string;
  isFinished: boolean;
  stats: HabitStats;
}

// create new HabitStats Object
function initHabitStats(): HabitStats {
  return {
    strength:0 ,dexterity:0, constitution:0, intelligence:0, wisdom: 0, charisma: 0, spiritual: 0, emotional:0, reputation:0, discipline: 0, creativity: 0,
    };
}

// random generations
function generateId(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    const randomIndex = getRandomInt(0, charactersLength);
    result += characters.charAt(randomIndex);
  };
  return result;
};
function getRandomInt(minn: number, maxx: number) {
  minn = Math.ceil(minn);
  maxx = Math.floor(maxx);
  return Math.floor(Math.random() * (maxx - minn + 1)) + minn;
};

// to be called for all the Logic in the system
function useLogicPackage() {

  // contains all habit informations
  const [habitArr, setHabitArr] = useState<HabitFormat[]>(() => {
    const habitArrStorage = localStorage.getItem('habits');
    return habitArrStorage? JSON.parse(habitArrStorage) : [];
  });
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habitArr));
  }, [habitArr]);
  
  // day counter
  const [day, setDay] = useState<number>(() => {
    const day = localStorage.getItem('day');
    return day? JSON.parse(day) : 1;
  });
  useEffect(() => {
    localStorage.setItem('day', JSON.stringify(day));
  }, [day]);

  // player current stats
  const [currentStats, setCurrentStats] = useState<HabitStats>(() => {
    const currentStats= localStorage.getItem('currentStats');
    return currentStats? JSON.parse(currentStats) : initHabitStats()
  });
  useEffect(() => {
    
    localStorage.setItem('currentStats', JSON.stringify(currentStats));
  }, [currentStats]);

  // counts sum of every stats in every habits of a habit array
  function countStats(habitArr: HabitFormat[]): HabitStats {
    const totalStats: HabitStats = initHabitStats();

    for (const habit of habitArr) {
      if (habit.isFinished) {
        for (const key of Object.keys(habit.stats)) {
          totalStats[key as keyof typeof habit.stats] += habit.stats[key as keyof typeof habit.stats];
        };
      };
      
    }

    return totalStats;
  }

  // player stats for today before submitting, will be appended to currentStats if day is advanced
  const [todayStats, setTodayStats] = useState<HabitStats>(() => {
    return countStats(habitArr);
  });

  // adding habit after submitting habit form
  function addHabit(habit: HabitFormat) {
    setHabitArr([...habitArr, habit]);
  }

  // setting all habits as undone, used for advancing the day or resetting
  function undoAllHabit() {
    const newHabitarr = habitArr.map((habit) => {
      if (habit.isFinished) {
        return {...habit, isFinished: false};
      }

      return habit;
    })

    setHabitArr(newHabitarr);
  }

  // highest point in player stats
  const [maxPoint, setMaxPoint] = useState<number>([...Object.values(currentStats), ...Object.values(todayStats)].reduce((prev, next) => {
    return Math.max(prev, next);
  }, 0));

  // total point from all stats
  const [totalPoint, setTotalPoint] = useState<number>([...Object.values(currentStats), ...Object.values(todayStats)].reduce(
    (accu, value) => {
      return accu + value;
  }, 0));

  // counts sum of all stats from current plus today
  function updateXp(nextTodayStats: HabitStats) {
    setTotalPoint([...Object.values(currentStats), ...Object.values(nextTodayStats)].reduce(
      (accu, value) => {
        return accu + value;
      }, 0));
  }

  // appending stats from today to current
  function addStats() {
    const newCurrentStats = {...currentStats};
    for (const key of Object.keys(todayStats)) {
      newCurrentStats[key as keyof typeof newCurrentStats] += todayStats[key as keyof typeof newCurrentStats];
    }

    setCurrentStats(newCurrentStats);
  }
  
  // finding maximum point of all stats
  function calcMaxPoint(nextTodayStats: HabitStats) {
    setMaxPoint(Math.max(...Object.values(currentStats), ...Object.values(nextTodayStats), 1));
  }

  // if user clicks a check button from one of the habit element
  // marks habit as finished, then updates todaystats and temporarily updates max point and total point
  function handleHabitChecks(id: string) {
    const newHabitArr = habitArr.map((habit) => {
      if (habit.id == id) {
        return {...habit, isFinished: !habit.isFinished}
      }

      return habit;

    })

    const nextTodayStats = countStats(newHabitArr);

    setHabitArr(newHabitArr);
    setTodayStats(nextTodayStats);
    calcMaxPoint(nextTodayStats);
    updateXp(nextTodayStats);

  }

  // if the user clicks the trash button on a habit element
  // will delete the habit off of the habit array, and then updates today's stats and temporarily updates max point and total point
  function handleRemoveHabit(id: string) {
    const newHabitArr = habitArr.filter((habit) => {
      return habit.id !== id;
    })

    setHabitArr(newHabitArr);

    const nextTodayStats = countStats(newHabitArr);
    setTodayStats(nextTodayStats);
    calcMaxPoint(nextTodayStats);
    updateXp(nextTodayStats);
  }

  // when user submits habit data
  // get form data and then transforming it into a HabitFormat object, and then adding it to the habit array
  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const newHabit: HabitFormat = {
            id: generateId(3),
            title: formData.get('title') as string,
            hour: formData.get('hour') as string,
            isFinished: false,
            stats : {
              strength: parseInt(formData.get('strength') as string),
              dexterity: parseInt(formData.get('dexterity') as string),
              constitution: parseInt(formData.get('constitution') as string),
              intelligence: parseInt(formData.get('intelligence') as string),
              wisdom: parseInt(formData.get('wisdom') as string),
              charisma: parseInt(formData.get('strength') as string),
              spiritual: parseInt(formData.get('spiritual') as string),
              emotional: parseInt(formData.get('emotional') as string),
              reputation: parseInt(formData.get('reputation') as string),
              discipline: parseInt(formData.get('discipline') as string),
              creativity: parseInt(formData.get('creativity') as string),
            }

        };
        addHabit(newHabit);
        e.currentTarget.reset();
  };

  // when the user clicks advance day and submit stats
  // appends stats from today to current, undo all habits, and update today stats to be an empty HabitStats object
  function handleAdvanceDay() {
    setDay(day + 1);

    addStats();
    undoAllHabit();
    setTodayStats(initHabitStats());
  }

  // when the user clicks reset stats
  // sets the day to day 1, undo all habits, set today stats and current stats to be an empty HabitStats object, and set the max and total point to be 0
  function handleResetStats() {
    const emptyStats = initHabitStats();

    setDay(1);
    undoAllHabit();
    setTodayStats(emptyStats);
    setCurrentStats(emptyStats);
    setMaxPoint(0);
    setTotalPoint(0);
  };

  // pass all of the states and functions to the top component
  return {
    handleAdvanceDay,
    day,
    handleSubmit,
    habitArr,
    handleRemoveHabit,
    handleHabitChecks,
    currentStats,
    todayStats,
    maxPoint,
    totalPoint,
    handleResetStats
  }
}

// visuals ============================================================================================

// parameters for a FormInput component
interface FormField {
  name: string;
  label: string;
  type: string;
  errorMessage?: string;
  min?: number;
  max?: number;
  value?: number;
}

function FormInput({name, label, type, errorMessage = "", min = 0, max = 0, value=0}: FormField) {
  
  const [isNotFirstEnter, setIsNotFirstEnter] = useState<boolean>(false);
  const [FieldInput, setFieldInput] = useState<string>(type == "range"? "0" : "");
  const isError: string = isNotFirstEnter && FieldInput.length < 1 ? '' : 'opacity-0'; 

  const isSlider: boolean = type == "range";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isNotFirstEnter) {
        setFieldInput(e.target.value);
        return
    }

    setIsNotFirstEnter(true);
    setFieldInput(e.target.value);
  }

  return (
    <>
      <label className='bold'>{label}</label>
      <div className='flex w-full justify-between items-stretch content-stretch gap-10'>
        <input
        className='border rounded-[0.3rem] h-8 mb-2 w-[98%] transition-all duration-100 ease-in focus:outline-0 
        focus:border-red-600 focus:bg-red-200 focus:shadow-orange-200 p-2'
        name={name}
        onChange={handleChange}
        type={type}
        required
        min={min}
        max={max}
        defaultValue={isSlider? value : ""}

        />
        {isSlider && <label>{FieldInput}</label>}
      </div>
      
      <label className={'taskName text-red-500 transition-all duration-100 ease-out ' + isError} htmlFor='taskName'>{errorMessage}</label>
      
    </>
  )
}

interface FormHandlers {
  setIsFormActive: (isActive: boolean) => void;
  handleSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
}

function HabitForm({setIsFormActive, handleSubmit}: FormHandlers) {
  // for referring to an element in the component
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
      // if there is an overlay AND outside of the overlay is clicked
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setIsFormActive(false);
      } 
    } 

    document.addEventListener("mousedown", handleClickOutside);
    return () => { // to delete the listener once the overlay dismounts from DOM (disappears)
      document.removeEventListener("mousedown", handleClickOutside);
    }

  }, []);
  

  return (
    <div 
    className='size-v h-screen w-full top-0 left-0 flex items-start justify-center fixed z-2 bg-[rgba(15,0,0,0.244)] backdrop-blur-sm
    overflow-x-scroll p-12 max-md:p-4 max-md:pt-12
    '
    >
      <div className='flex flex-col border gap-2 p-4 w-[50%] max-sm:w-full bg-white rounded-2xl'
      ref={overlayRef} // overlayRef reference
      >
        <h1 className='text-3xl font-bold'>Input new Habit</h1>
        <form className='flex flex-col gap'
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e) // pass data of e
          setIsFormActive(false);
        }}

        >
          <h2 className='text-2xl'>Informasi</h2>
          <FormInput name="title" label="Masukkan kebiasaan yang sering dilakukan" type="text" errorMessage='Nama tidak boleh kosong!'/>
          <FormInput name="hour" label="Masukkan jadwal (jam) kebiasaan dilakukan" type="time" errorMessage='Jam tidak boleh kosong!'/>
          <h2 className='text-2xl'>Penambahan Stat</h2>
          <h3>Jika usai dikerjakan</h3>
          <FormInput name="strength" label="Strength 💪" type="range" min={0} max={255}/>
          <FormInput name="dexterity" label="Dexterity 🎯" type="range" min={0} max={255}/>
          <FormInput name="constitution" label="Constitution 🌋" type="range" min={0} max={255}/>
          <FormInput name="intelligence" label="Intelligence 🧠" type="range" min={0} max={255}/>
          <FormInput name="wisdom" label="Wisdom 🧙‍♂️" type="range" min={0} max={255}/>
          <FormInput name="charisma" label="Charisma 🗣️" type="range" min={0} max={255}/>
          <FormInput name="spiritual" label="Spiritual ✨" type="range" min={0} max={255}/>
          <FormInput name="emotional" label="Emotional 💕" type="range" min={0} max={255}/>
          <FormInput name="reputation" label="Reputation 🫃" type="range" min={0} max={255}/>
          <FormInput name="discipline" label="Discipline 📚" type="range" min={0} max={255}/>
          <FormInput name="creativity" label="Creativity 🎨" type="range" min={0} max={255}/>

          <button type="submit" className='border w-fit p-2 cursor-pointer rounded-sm transition-all duration-100 ease-in hover:bg-red-400 hover:text-white hover:border-white'
          >Create Habit</button>
        </form>
      </div>
      
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// tuple for every stat and its associated color
type statElementArrFormat = [string, string];

// parameter for CharacterProfile component
interface ProfileParms {
  currentStats: HabitStats;
  todayStats: HabitStats;
  maxPoint: number;
  totalPoint: number;
}

function CharacterProfile({currentStats, todayStats, maxPoint, totalPoint}: ProfileParms) {
  // counting for xp bar width and level-------------------------------------
  let level: number = 1;

  let xpCap: number = 100;
  const xpCapMulti: number = 210/100;

  while (totalPoint > xpCap) {
    xpCap *= xpCapMulti;
    level += 1
  }

  xpCap = Math.ceil(xpCap);

  const percentage: number = totalPoint / xpCap * 100;
  
  // ---------------------------------------------------------------------------
  const statTableKeys = [
    "strength" , "dexterity", "constitution", "intelligence", "wisdom", "charisma", "spiritual", "emotional", "reputation", "discipline", "creativity"
  ]

  const statsTable: statElementArrFormat[] = [
    ["Strength", "from-amber-500 to-red-500"],
    ["Dexterity", "from-teal-400 to-lime-500"], 
    ["Constitution", "from-blue-500 to-pink-500"], 
    ["Intelligence", "from-cyan-400 to-fuchsia-400"], 
    ["Wisdom", "from-red-200 to-pink-500"], 
    ["Charisma", "from-purple-500 to-blue-300"], 
    ["Spiritual", "from-amber-200 via-pink-300 to-fuchsia-400"], 
    ["Emotional", "from-pink-300 to-red-400"], 
    ["Reputation", "from-yellow-300 to-red-200"], 
    ["Discipline", "from-mauve-200 to-slate-700"], 
    ["Creativity", "from-fuchsia-400 to-orange-300"]
  ]
  const statsElement = statsTable.map((stat, i) => {
    const point = currentStats[statTableKeys[i] as keyof typeof currentStats] + todayStats[statTableKeys[i] as keyof typeof currentStats];
    return (
      <tr key={i} className='flex gap-2'>
        <th className='min-w-[25%]'><strong>{stat[0]} : </strong></th>
        <td className='flex grow'><div className={'bg-linear-to-r ' + stat[1]}
        style={{
          width: `${((point) / maxPoint * 100)? (point) / maxPoint * 100 : 0.1}%`, // width based on ratio of this stat's point and the maximum point from all stats
          transition: 'all 0.5s ease'
        }as React.CSSProperties}></div></td>
        <td>{point}</td>
      </tr>
    )
  });

  return (
    <div className='flex flex-col border rounded-2xl p-4 gap-2 relative'>
      <span className='flex gap-1 items-center'><h1 className='font-extrabold text-3xl'>You</h1> <h2 className='text-3xl font-bold'> &#183; Lvl {level}</h2></span>
      <h3>XP : </h3>
      <div className='flex border rounded-2xl overflow-clip'>
        <div className='h-5 bg-green-400' style={{
          width: `${percentage}%`,
          transition: "all 0.5s ease-out"
        } as React.CSSProperties}></div>
      </div>
      <div className='flex justify-between'>
        <span>0</span><span>{xpCap}</span>
      </div>
      <table>
        <tbody className='flex flex-col gap-3'>
          {statsElement}
          
        </tbody>
      </table>
    </div>
  );
}
// ------------------------------------------------------------------------------------------------------------------

// parameter for a habit element
interface HabitViewParams {
  id: string;
  title: string; 
  hour: string;
  isFinished: boolean;
  handleHabitCheck: (id: string) => void;
  handleRemoveCheck: (id: string) => void;
}

function Habit({id, title, hour,isFinished ,handleHabitCheck, handleRemoveCheck}: HabitViewParams) {
  return (
    <div className='h-25 p-4 border w-full flex justify-between relative overflow-hidden'>
      <div className='flex flex-col h-fit'> 
        <h1 className='text-2xl font-extrabold'>{title}</h1>
        <h1 className='text-[1.25rem]'>{hour}</h1>
      </div>
      <div className='flex gap-2 max-h-15.5'>
        { !isFinished &&
          <button className='flex cursor-pointer'
          onClick={() => handleHabitCheck(id)}
          >
            <img src={greenCheck} />
          </button>
        }
        { isFinished &&
          <button className='flex cursor-pointer'
          onClick={() => handleHabitCheck(id)}
          >
            <img src={restore} />
          </button>
        }
        <button className='flex cursor-pointer'
        onClick={() => handleRemoveCheck(id)}
        >
        <img src={trash} />
        </button>
        <div className='absolute top-5 right-20 rounded-full transition-all duration-300 z-[-1]'
        style={{
          width: isFinished? "100%": "52px",
          height: isFinished? "100%" : "52px",
          top: isFinished? "0" : "1.25rem" ,
          right: isFinished? "0" : "5rem" ,
          backgroundColor: isFinished? "#cee4be":"#80d83f",
          opacity: isFinished? "1" : "0",
          transform: isFinished? "scale(2)" : ""
        } as React.CSSProperties}
        ></div>
      </div>
    </div>
  )
}

// parameter for HabitContainer
interface habitViewHandlers {
  habitArr: HabitFormat[];
  handleHabitCheck: (id: string) => void;
  handleRemoveCheck: (id: string) => void;
}

// to render all habit elements
function HabitContainer({habitArr, handleHabitCheck, handleRemoveCheck} : habitViewHandlers) {
  const habitElements = habitArr.map((habit) => {
    return <Habit key={habit.id} id={habit.id} title={habit.title} isFinished={habit.isFinished} hour={habit.hour} handleHabitCheck={handleHabitCheck} handleRemoveCheck={handleRemoveCheck}/>
  })

  return (
    <>
      {habitElements}
    </>
  );
}

// ------------------------------------------------------------------------------------------------------------------

interface ResetConfirmParams {
  setIsResetConfirmActive: React.Dispatch<React.SetStateAction<boolean>>;
  handleResetStats: () => void;

}

function ResetConfirm({setIsResetConfirmActive, handleResetStats}: ResetConfirmParams) {
  // same thing as form outside overlay click, but for resetConfirm
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setIsResetConfirmActive(false);
      } 
    } 

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }

  }, []);
  

  return (
    <div 
    className='size-v h-screen w-full top-0 left-0 flex items-center justify-center fixed z-2 bg-[rgba(15,0,0,0.244)] backdrop-blur-sm
    overflow-x-scroll p-4 max-md:p-4 max-md:pt-12'
    >
      <div className='flex flex-col items-center border gap-2 p-4 w-[50%] max-sm:w-full max-w-2xl bg-white rounded-2xl'
      ref={overlayRef}
      >
        <h1 className='text-3xl font-bold'>Yakin ingin mereset?</h1>
        <h2 className='text-2xl'>Hari, level, dan stat akan direset.</h2>

        <div className='flex justify-between w-[60%] max-lg:w-full my-3'>
          <button className='border p-2 cursor-pointer rounded-sm transition-all duration-100 ease-in hover:bg-slate-900 hover:text-white hover:border-white w-20'
          onClick={() => setIsResetConfirmActive(false)}
          >Tidak</button>
          <button className='bg-red-400 border text-white border-white w-20 p-2 cursor-pointer rounded-sm transition-all duration-100 ease-in hover:border-red-400 hover:text-red-400 hover:bg-white'
          onClick={handleResetStats}
          >Ya</button>
        </div>
        
      </div>
      
    </div>
  )
}

// ------------------------------------------------------------------------------------------------------------------


function Content() {
  const {handleAdvanceDay, day, habitArr, handleSubmit, handleHabitChecks, 
    handleRemoveHabit, todayStats, currentStats ,maxPoint ,totalPoint, handleResetStats} = useLogicPackage(); // unpackage all logic

  const [isFormActive , setIsFormActive] = useState<boolean>(false)
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [isResetConfirmActive, setIsResetConfirmActive] = useState<boolean>(false);
  
  // handles user clicking advance day logic and anim
  function handleAdvanceDayAnim() {
    setIsAdvancing(true);

    setTimeout(() => {
      handleAdvanceDay();
    }, 300);

    setTimeout(() => {
      setIsAdvancing(false);
    }, 1000);
  };

  // handles user clicking reset stats logic and anim
  function handleResetStatsAnim() {
    setIsAdvancing(true);
    setIsResetConfirmActive(false);

    setTimeout(() => {
      handleResetStats();
    }, 300);

    setTimeout(() => {
      setIsAdvancing(false);
    }, 1000);
  }

  return (
    <>
      <main className='min-h-full flex flex-wrap items-stretch'>
        <aside className='min-h-10 flex grow flex-col p-4 basis-100 gap-2'>
          <CharacterProfile currentStats={currentStats} todayStats={todayStats} maxPoint={maxPoint} totalPoint={totalPoint}/>
          <div className='border p-4 rounded-2xl relative overflow-clip'>
            <h1 className='text-5xl text-center font-bold'>DAY {day}</h1>
            <div className={`bg-red-400 h-full absolute w-5 top-0 -left-5 ${+ isAdvancing? "animate-advanceDay" : ""}` }></div>
          </div>
          <button className='border p-1 cursor-pointer rounded-2xl'
          onClick={() => {
            handleAdvanceDayAnim();
          }}
          >Advance Day and submit stats</button>
          <button className='border p-1 cursor-pointer rounded-2xl'
          onClick={() => setIsResetConfirmActive(true)}
          >Reset Stats</button>
        </aside>
        <article className=' min-h-10 grow-5 basis-50 flex flex-col p-4 items-center gap-2'>
          <button className='rounded-full w-15 h-15 border relative'
          onClick={() => setIsFormActive(true)}
          ><h1 className='text-5xl font-bold absolute transform-[translate(12px,-30px)]'>+</h1></button>
          {/* put habits here */}
          <HabitContainer habitArr={habitArr} handleRemoveCheck={handleRemoveHabit} handleHabitCheck={handleHabitChecks} />
          
        </article>
        
      </main>
      { isFormActive && <HabitForm setIsFormActive={setIsFormActive} handleSubmit={handleSubmit}/> }
      {/* enables only when user clicked on the plus element */}
      { isResetConfirmActive && <ResetConfirm setIsResetConfirmActive={setIsResetConfirmActive} handleResetStats={handleResetStatsAnim}/> }
      {/* enables only when user clicked on the reset stats button */}
    </>
  );
}

function Main() {
  return (
    <>
      <header id="header" className="w-full bg-red-400 p-3 text-white ps-4 sticky top-0 z-1">
        <h1 className='font-extrabold text-[2rem]'>Habit Tracker</h1></header>
      <Content />
    </>
  )
};

export default Main;
