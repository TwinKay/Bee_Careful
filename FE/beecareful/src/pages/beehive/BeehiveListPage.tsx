import BeehiveMap from '@/components/beehive/BeeHiveMap';
import Button from '@/components/common/Button';
import { ROUTES } from '@/config/routes';
import { Link } from 'react-router-dom';

const BeehiveListPage = () => {
  return (
    <div className="flex h-screen w-full flex-col bg-gray-50">
      {/* 메인 컨텐츠 영역 */}
      <main className="flex flex-1 flex-col overflow-hidden px-4 lg:flex-row">
        <section>
          {/* 임시버튼 */}
          <Link to={ROUTES.BEEHIVE_DETAIL('1')}>
            <Button size="sm" className="mt-2 flex-1" fullWidth>
              Go to Beehive Detail (id:1)
            </Button>
          </Link>
        </section>
        {/* 벌통 맵 영역 */}
        <section className="h-[80vh] pt-4 lg:h-auto lg:w-2/3">
          <div className="h-full w-full overflow-hidden rounded-lg bg-white">
            <BeehiveMap />
          </div>
        </section>
        <section className="absolute bottom-6 left-4 right-4 flex justify-between gap-2">
          <Link to={ROUTES.DIAGNOSIS_CREATE}>
            <Button variant="success" size="xxl">
              질병 검사
            </Button>
          </Link>
          <Button
            type="submit"
            variant="neutral"
            size="lg"
            className="flex items-center justify-center"
          >
            <img src="/icons/hive-add.png" alt="보관함" className="h-8 w-8 object-contain" />
          </Button>
        </section>
        {/* 임시버튼 */}
      </main>
    </div>
  );
};

export default BeehiveListPage;
