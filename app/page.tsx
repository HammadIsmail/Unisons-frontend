import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis repellendus sequi error esse saepe id quae facere mollitia culpa doloribus illum deleniti dignissimos aut rerum eos, iste quibusdam atque ipsam omnis. Nostrum inventore exercitationem voluptatum animi quod incidunt et tempore nihil fugiat, obcaecati consectetur delectus earum sunt commodi at ratione repellendus fugit, optio eius labore nesciunt tempora ab, temporibus pariatur. Nostrum enim pariatur officiis neque saepe debitis iure inventore quo molestias ratione, excepturi ea, libero laborum rem doloremque omnis mollitia rerum dolorem! Facere sed fugit, quibusdam mollitia, voluptas labore corrupti odit vel maiores fuga modi placeat minus eligendi ratione? Magnam itaque eius minima aspernatur ab tenetur repellat! Cupiditate rem facere magnam hic nisi velit, vero sit assumenda deleniti deserunt dolorem maiores magni, expedita ut, harum aliquam voluptatem perspiciatis saepe? Aliquid veniam eveniet at, est nam deleniti modi, inventore nostrum itaque quos ipsam facere dicta iste? Eveniet laborum eligendi veniam autem exercitationem fugit cumque fugiat maiores minus ab nesciunt dolorum magnam quam mollitia maxime ducimus dicta eius placeat nemo quibusdam veritatis, voluptate molestias itaque? Perspiciatis itaque consectetur temporibus cupiditate repellat impedit laboriosam quas quod cum dicta atque earum ut, rerum eaque ab eveniet? Et aliquam modi animi labore, fugiat ipsum voluptas laboriosam voluptate quis nemo atque sint earum maiores soluta at porro, tempore expedita laudantium tempora consectetur. Totam illum iste assumenda ab voluptatum recusandae, veniam dolor fugiat nobis doloremque minima magnam reprehenderit id odio pariatur quam impedit inventore odit ea. Laboriosam ratione fuga non adipisci velit qui soluta quod cumque in eius blanditiis corrupti ipsum dicta, id nam nisi, est minima quas amet natus deserunt nostrum, delectus dolore nulla? Fugiat quos ex non perspiciatis iste quod nesciunt consequuntur esse? Perspiciatis dolores, recusandae temporibus, consequuntur reiciendis aspernatur iusto voluptatum laboriosam nobis eum minus. Ipsam cumque fugit qui delectus ut sint repellendus harum consectetur dolorem et velit laudantium, omnis quaerat placeat repudiandae aliquid laboriosam magnam maiores perferendis ipsa. Soluta ullam quisquam, aperiam, porro consectetur fugiat consequatur maiores culpa dicta unde aliquid distinctio eos, beatae repellat? Vero, officiis nihil animi necessitatibus incidunt commodi obcaecati. Quam, eos! Pariatur id doloremque tempore maxime, soluta porro nobis quod consectetur nam expedita veritatis commodi ipsam quae aperiam a, neque illum officiis. Unde fugiat mollitia consequatur nemo exercitationem tempore sit, dignissimos, saepe neque harum consectetur impedit numquam. Maiores ullam minus quae cumque placeat hic id, illum deleniti vitae quibusdam. Adipisci perspiciatis aliquid odit distinctio sapiente accusamus error perferendis ut eligendi architecto laborum, optio veniam? Iusto ab cupiditate repellendus molestiae necessitatibus? Amet, reiciendis. Numquam voluptatum harum excepturi reiciendis inventore. Illo voluptas dolor id deleniti fugit maxime fugiat quasi, enim, minus soluta delectus, eum at perspiciatis cumque esse optio praesentium! Recusandae, modi beatae? Officia porro nemo nam odio fugit similique voluptas reprehenderit quibusdam at. Blanditiis voluptatem, reprehenderit, sequi consequuntur perferendis et dicta eligendi quidem harum repellendus animi ullam corrupti architecto facere rem commodi at odit reiciendis? Quisquam nobis illo optio error culpa? Quisquam repudiandae vitae, necessitatibus mollitia ipsam vero quibusdam in nemo corporis eius sunt et libero? Explicabo sunt accusantium aspernatur!
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates 
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
